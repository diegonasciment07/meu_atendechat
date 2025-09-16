import crypto from 'crypto';
import AppError from '../../errors/AppError';

class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly IV_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;

  private static getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new AppError('ENCRYPTION_KEY environment variable is required', 500);
    }
    if (key.length < 32) {
      throw new AppError('ENCRYPTION_KEY must be at least 32 characters long', 500);
    }
    return key.substring(0, 32); // Usar solo los primeros 32 caracteres
  }

  public static encrypt(text: string): string {
    try {
      const key = EncryptionService.getEncryptionKey();
      const iv = crypto.randomBytes(EncryptionService.IV_LENGTH);
      const cipher = crypto.createCipher(EncryptionService.ALGORITHM, key);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new AppError('Failed to encrypt data', 500);
    }
  }

  public static decrypt(encryptedData: string): string {
    try {
      const key = EncryptionService.getEncryptionKey();
      const parts = encryptedData.split(':');
      
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }
      
      const encrypted = parts[1];
      const decipher = crypto.createDecipher(EncryptionService.ALGORITHM, key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new AppError('Failed to decrypt data', 500);
    }
  }

  public static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  public static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  public static validateApiKeyFormat(apiKey: string): boolean {
    const openaiPattern = /^sk-[a-zA-Z0-9]{20,}$/;
    return openaiPattern.test(apiKey);
  }
}

export default EncryptionService;


