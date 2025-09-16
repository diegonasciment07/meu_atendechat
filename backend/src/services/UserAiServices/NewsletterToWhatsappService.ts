import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import axios from 'axios';
import GetUserAiConfigService from './GetUserAiConfigService';
import LogAiUsageService from './LogAiUsageService';
import AppError from '../../errors/AppError';

interface NewsletterConversionData {
  userId: string;
  content: string;
  content_type: 'text' | 'html' | 'url';
  tone: 'professional' | 'casual' | 'commercial' | 'informative';
  message_count: number;
  max_chars_per_message: number;
}

interface ConversionResult {
  messages: string[];
  total_tokens: number;
  estimated_cost: number;
  model_used: string;
  execution_time: number;
}

class NewsletterToWhatsappService {
  private getUserAiConfigService: GetUserAiConfigService;
  private logAiUsageService: LogAiUsageService;

  constructor() {
    this.getUserAiConfigService = new GetUserAiConfigService();
    this.logAiUsageService = new LogAiUsageService();
  }

  public async execute(data: NewsletterConversionData): Promise<ConversionResult> {
    const startTime = Date.now();
    let model_used = 'gpt-4o-mini';

    try {
      // Validar datos de entrada
      this.validateInput(data);

      // Verificar límite diario
      const limitCheck = await this.logAiUsageService.checkDailyLimit(data.userId);
      if (!limitCheck.canUse) {
        throw new AppError(
          `Daily limit reached. You have used ${limitCheck.current_usage}/${limitCheck.limit} conversions today.`,
          429
        );
      }

      // Obtener API key del usuario
      const apiKey = await this.getUserAiConfigService.getDecryptedApiKey(data.userId);
      if (!apiKey) {
        throw new AppError('OpenAI API key not configured', 400);
      }

      // Obtener configuración del usuario
      const config = await this.getUserAiConfigService.execute(data.userId);
      model_used = config.preferred_model || 'gpt-4o-mini';

      // Procesar contenido según el tipo
      const processedContent = await this.processContent(data.content, data.content_type);

      // Crear cliente OpenAI
      const openai = new OpenAI({ apiKey });

      // Generar mensajes
      const result = await this.generateMessages(openai, {
        ...data,
        content: processedContent,
        model_used
      });

      const execution_time = Date.now() - startTime;

      // Registrar uso exitoso
      await this.logAiUsageService.execute({
        userId: data.userId,
        feature: 'newsletter',
        model_used,
        tokens_used: result.total_tokens,
        estimated_cost: result.estimated_cost,
        request_data: {
          content_type: data.content_type,
          tone: data.tone,
          message_count: data.message_count,
          max_chars_per_message: data.max_chars_per_message,
          content_length: processedContent.length
        },
        response_data: {
          messages_generated: result.messages.length,
          total_chars: result.messages.join('').length
        },
        success: true,
        execution_time
      });

      return {
        ...result,
        execution_time
      };

    } catch (error) {
      const execution_time = Date.now() - startTime;

      // Registrar uso fallido
      await this.logAiUsageService.execute({
        userId: data.userId,
        feature: 'newsletter',
        model_used,
        tokens_used: 0,
        estimated_cost: 0,
        request_data: {
          content_type: data.content_type,
          tone: data.tone,
          message_count: data.message_count
        },
        response_data: {},
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        execution_time
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to convert newsletter content', 500);
    }
  }

  private validateInput(data: NewsletterConversionData): void {
    if (!data.content || data.content.trim().length === 0) {
      throw new AppError('Content is required', 400);
    }

    if (data.message_count < 1 || data.message_count > 10) {
      throw new AppError('Message count must be between 1 and 10', 400);
    }

    if (data.max_chars_per_message < 50 || data.max_chars_per_message > 1000) {
      throw new AppError('Max characters per message must be between 50 and 1000', 400);
    }

    const validTones = ['professional', 'casual', 'commercial', 'informative'];
    if (!validTones.includes(data.tone)) {
      throw new AppError(`Invalid tone. Must be one of: ${validTones.join(', ')}`, 400);
    }

    const validContentTypes = ['text', 'html', 'url'];
    if (!validContentTypes.includes(data.content_type)) {
      throw new AppError(`Invalid content type. Must be one of: ${validContentTypes.join(', ')}`, 400);
    }
  }

  private async processContent(content: string, contentType: string): Promise<string> {
    let processedContent = content;

    switch (contentType) {
      case 'url':
        processedContent = await this.extractContentFromUrl(content);
        break;
      case 'html':
        processedContent = this.cleanHtmlContent(content);
        break;
      case 'text':
      default:
        processedContent = content.trim();
        break;
    }

    // Limitar longitud del contenido
    if (processedContent.length > 8000) {
      processedContent = processedContent.substring(0, 8000) + "...";
    }

    if (processedContent.length < 50) {
      throw new AppError('Content is too short. Minimum 50 characters required.', 400);
    }

    return processedContent;
  }

  private async extractContentFromUrl(url: string): Promise<string> {
    try {
      // Validar URL
      new URL(url);

      const response = await axios.get(url, {
        timeout: 15000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      // Remover elementos no deseados
      $('script, style, nav, footer, header, aside, .advertisement, .ads, .social-share').remove();

      // Intentar extraer contenido principal
      let content = '';
      
      // Priorizar elementos de contenido principal
      const mainSelectors = [
        'main article',
        'article',
        '.post-content',
        '.entry-content',
        '.content',
        '.post',
        '.article-body',
        'main',
        '.main-content'
      ];

      for (const selector of mainSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text();
          break;
        }
      }

      // Si no encontró contenido principal, usar el body
      if (!content || content.length < 200) {
        content = $('body').text();
      }

      // Limpiar espacios en blanco
      content = content.replace(/\s+/g, ' ').trim();

      if (content.length < 100) {
        throw new AppError('Could not extract sufficient content from URL', 400);
      }

      return content;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to extract content from URL. Please verify the URL is accessible.', 400);
    }
  }

  private cleanHtmlContent(html: string): string {
    try {
      const $ = cheerio.load(html);
      $('script, style').remove();
      return $.text().replace(/\s+/g, ' ').trim();
    } catch (error) {
      throw new AppError('Failed to process HTML content', 400);
    }
  }

  private getToneInstructions(tone: string): string {
    const toneMap = {
      professional: "Mantén un tono profesional y formal, evita emojis excesivos, usa lenguaje corporativo apropiado",
      casual: "Usa un tono amigable y cercano, puedes incluir emojis apropiados, lenguaje conversacional",
      commercial: "Enfócate en la venta y call-to-action, crea urgencia y deseo, incluye elementos persuasivos",
      informative: "Prioriza la claridad y la información útil, sé educativo y preciso, estructura la información"
    };
    return toneMap[tone] || toneMap.informative;
  }

  private async generateMessages(openai: OpenAI, data: NewsletterConversionData & { model_used: string }): Promise<Omit<ConversionResult, 'execution_time'>> {
    const toneInstructions = this.getToneInstructions(data.tone);

    const prompt = `Convierte el siguiente contenido de newsletter en ${data.message_count} mensajes de WhatsApp optimizados.

INSTRUCCIONES ESPECÍFICAS:
- Cada mensaje debe tener máximo ${data.max_chars_per_message} caracteres
- ${toneInstructions}
- Mantén la información más importante y relevante
- Usa saltos de línea para mejorar la legibilidad
- Incluye emojis relevantes pero sin exceso (máximo 3 por mensaje)
- Cada mensaje debe ser independiente pero conectado temáticamente
- Numera los mensajes como "Mensaje 1:", "Mensaje 2:", etc.
- Asegúrate de que cada mensaje sea completo y tenga sentido por sí solo
- Prioriza la información más valiosa en los primeros mensajes

CONTENIDO A CONVERTIR:
${data.content}

Genera exactamente ${data.message_count} mensajes optimizados para WhatsApp:`;

    try {
      const response = await openai.chat.completions.create({
        model: data.model_used,
        messages: [
          {
            role: "system",
            content: "Eres un experto en marketing digital especializado en convertir contenido largo en mensajes de WhatsApp efectivos y atractivos. Tu objetivo es mantener la esencia del contenido original mientras lo adaptas al formato de mensajería móvil."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: Math.min(2500, data.message_count * 200),
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const generatedContent = response.choices[0]?.message?.content || "";
      
      if (!generatedContent) {
        throw new AppError('No content generated by AI model', 500);
      }

      // Parsear mensajes de la respuesta
      const messages = this.parseMessages(generatedContent, data.message_count, data.max_chars_per_message);
      
      // Calcular costos
      const totalTokens = response.usage?.total_tokens || 0;
      const estimatedCost = this.calculateCost(data.model_used, totalTokens);

      return {
        messages,
        total_tokens: totalTokens,
        estimated_cost: estimatedCost,
        model_used: data.model_used
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // Manejar errores específicos de OpenAI
      if (error.code === 'insufficient_quota') {
        throw new AppError('OpenAI API quota exceeded. Please check your OpenAI account.', 402);
      }
      
      if (error.code === 'invalid_api_key') {
        throw new AppError('Invalid OpenAI API key. Please update your configuration.', 401);
      }

      throw new AppError('Failed to generate content with AI model', 500);
    }
  }

  private parseMessages(content: string, expectedCount: number, maxChars: number): string[] {
    const lines = content.split('\n');
    const messages: string[] = [];
    let currentMessage = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Verificar si la línea empieza con "Mensaje X:" pattern
      const messageMatch = trimmedLine.match(/^Mensaje\s+\d+:/i);
      
      if (messageMatch) {
        // Guardar mensaje anterior si existe
        if (currentMessage.trim()) {
          messages.push(this.truncateMessage(currentMessage.trim(), maxChars));
        }
        // Empezar nuevo mensaje (remover el prefijo "Mensaje X:")
        currentMessage = trimmedLine.replace(/^Mensaje\s+\d+:\s*/i, '');
      } else if (trimmedLine) {
        // Agregar línea al mensaje actual
        if (currentMessage) {
          currentMessage += '\n' + trimmedLine;
        } else {
          currentMessage = trimmedLine;
        }
      }
    }

    // Agregar último mensaje
    if (currentMessage.trim()) {
      messages.push(this.truncateMessage(currentMessage.trim(), maxChars));
    }

    // Si el parsing falló, dividir contenido de manera uniforme
    if (messages.length === 0) {
      return this.fallbackMessageSplit(content, expectedCount, maxChars);
    }

    // Asegurar que tenemos el número correcto de mensajes
    while (messages.length < expectedCount && messages.length > 0) {
      // Dividir el mensaje más largo
      const longestIndex = messages.reduce((maxIndex, msg, index, arr) => 
        msg.length > arr[maxIndex].length ? index : maxIndex, 0);
      
      const longestMessage = messages[longestIndex];
      if (longestMessage.length > maxChars) {
        const splitPoint = Math.floor(longestMessage.length / 2);
        const firstPart = longestMessage.substring(0, splitPoint).trim();
        const secondPart = longestMessage.substring(splitPoint).trim();
        
        messages[longestIndex] = firstPart;
        messages.splice(longestIndex + 1, 0, secondPart);
      } else {
        break;
      }
    }

    return messages.slice(0, expectedCount);
  }

  private fallbackMessageSplit(content: string, expectedCount: number, maxChars: number): string[] {
    const words = content.replace(/\s+/g, ' ').trim().split(' ');
    const messages: string[] = [];
    const wordsPerMessage = Math.ceil(words.length / expectedCount);

    for (let i = 0; i < expectedCount; i++) {
      const start = i * wordsPerMessage;
      const end = Math.min(start + wordsPerMessage, words.length);
      const messageWords = words.slice(start, end);
      
      if (messageWords.length > 0) {
        const message = messageWords.join(' ');
        messages.push(this.truncateMessage(message, maxChars));
      }
    }

    return messages.filter(msg => msg.length > 0);
  }

  private truncateMessage(message: string, maxChars: number): string {
    if (message.length <= maxChars) {
      return message;
    }

    // Truncar en la palabra más cercana
    const truncated = message.substring(0, maxChars - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxChars * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  private calculateCost(model: string, tokens: number): number {
    const costPerToken: { [key: string]: number } = {
      'gpt-4o': 0.00003, // $30 per 1M tokens (average input/output)
      'gpt-4o-mini': 0.00000015, // $0.15 per 1M tokens (average input/output)
      'gpt-4': 0.00003, // $30 per 1M tokens (average input/output)
      'gpt-4-turbo': 0.00002, // $20 per 1M tokens (average input/output)
      'gpt-3.5-turbo': 0.000002 // $2 per 1M tokens (average input/output)
    };

    return (costPerToken[model] || costPerToken['gpt-4o-mini']) * tokens;
  }

  public getAvailableModels(): { model: string; description: string; cost_per_1k_tokens: number }[] {
    return [
      {
        model: 'gpt-4o-mini',
        description: 'Más económico, ideal para newsletters simples',
        cost_per_1k_tokens: 0.00015
      },
      {
        model: 'gpt-3.5-turbo',
        description: 'Rápido y económico, buena calidad general',
        cost_per_1k_tokens: 0.002
      },
      {
        model: 'gpt-4o',
        description: 'Alta calidad, mejor comprensión de contexto',
        cost_per_1k_tokens: 0.03
      },
      {
        model: 'gpt-4',
        description: 'Máxima calidad, ideal para contenido complejo',
        cost_per_1k_tokens: 0.03
      }
    ];
  }
}

export default NewsletterToWhatsappService;

