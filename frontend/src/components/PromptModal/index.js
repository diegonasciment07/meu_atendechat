import React, { useState, useEffect, useMemo } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import { i18n } from "../../translate/i18n";
import { MenuItem, FormControl, InputLabel, Select, Grid, Typography, Slider, Box } from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import { InputAdornment, IconButton } from "@material-ui/core";
import QueueSelectSingle from "../../components/QueueSelectSingle";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    },
    section: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2.5),
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.spacing(1),
        background: theme.palette.type === "light" ? "#fafafa" : theme.palette.background.paper,
    },
    sectionTitle: {
        fontWeight: 600,
        marginBottom: theme.spacing(1.5),
    },
    multFieldLine: {
        display: "flex",
        gap: theme.spacing(1),
        flexWrap: "wrap",
    },
    btnWrapper: {
        position: "relative",
    },
    buttonProgress: {
        color: green[500],
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
    helper: {
        marginTop: theme.spacing(0.5),
        color: theme.palette.text.secondary,
    },
    inlineHelper: {
        marginTop: theme.spacing(0.75),
        color: theme.palette.text.secondary,
    },
    sliderRow: {
        padding: theme.spacing(1.5),
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: theme.spacing(1),
        background: theme.palette.type === "light" ? "#fff" : theme.palette.background.default,
    },
    optionBadge: {
        display: "inline-flex",
        alignItems: "center",
        padding: theme.spacing(0.5, 1),
        borderRadius: theme.spacing(1),
        background: theme.palette.type === "light" ? "#e8f0fe" : theme.palette.action.hover,
        color: theme.palette.primary.main,
        fontWeight: 600,
        fontSize: "0.75rem",
    }
}));

const PromptSchema = Yup.object().shape({
    name: Yup.string().min(5, i18n.t("promptModal.formErrors.name.short")).max(100, i18n.t("promptModal.formErrors.name.long")).required(i18n.t("promptModal.formErrors.name.required")),
    prompt: Yup.string().min(50, i18n.t("promptModal.formErrors.prompt.short")).required(i18n.t("promptModal.formErrors.prompt.required")),
    model: Yup.string().required(i18n.t("promptModal.formErrors.modal.required")),
    maxTokens: Yup.number().required(i18n.t("promptModal.formErrors.maxTokens.required")),
    temperature: Yup.number().required(i18n.t("promptModal.formErrors.temperature.required")),
    apiKey: Yup.string().required(i18n.t("promptModal.formErrors.apikey.required")),
    queueId: Yup.number().required(i18n.t("promptModal.formErrors.queueId.required")),
    maxMessages: Yup.number().required(i18n.t("promptModal.formErrors.maxMessages.required"))
});

const PromptModal = ({ open, onClose, promptId, refreshPrompts }) => {
    const classes = useStyles();
    const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo-0125");
    const [showApiKey, setShowApiKey] = useState(false);

    const modelOptions = [
        { value: "gpt-4.1", label: "GPT-4.1", helper: "Modelo mais preciso, bom para respostas críticas." },
        { value: "gpt-4.1-mini", label: "GPT-4.1 Mini", helper: "Balanceia custo e contexto, rápido." },
        { value: "gpt-4o", label: "GPT-4o", helper: "Versátil, multimodal, ótimo equilíbrio." },
        { value: "gpt-4o-mini", label: "GPT-4o Mini", helper: "Econômico para fluxos de alto volume." },
        { value: "gpt-3.5-turbo-0125", label: "GPT-3.5 Turbo", helper: "Custo baixo, ideal para tarefas simples." },
    ];

    const temperatureMarks = [
        { value: 0, label: "Objetivo" },
        { value: 0.5, label: "Equilíbrio" },
        { value: 1, label: "Criativo" }
    ];

    const handleToggleApiKey = () => {
        setShowApiKey(!showApiKey);
    };

    const initialState = useMemo(() => ({
        name: "",
        prompt: "",
        model: "gpt-3.5-turbo-0125",
        maxTokens: 100,
        temperature: 1,
        apiKey: "",
        queueId: '',
        maxMessages: 10
    }), []);

    const [prompt, setPrompt] = useState(initialState);

    useEffect(() => {
        const fetchPrompt = async () => {
            if (!promptId) {
                setPrompt(initialState);
                return;
            }
            try {
                const { data } = await api.get(`/prompt/${promptId}`);
                setPrompt(prevState => {
                    return { ...prevState, ...data };
                });
                
                setSelectedModel(data.model);
            } catch (err) { 
                toastError(err);
            }
        };

        fetchPrompt();
    }, [promptId, open, initialState]);

    const handleClose = () => {
        setPrompt(initialState);
        setSelectedModel("gpt-3.5-turbo-1106");
        onClose();
    };

    const handleChangeModel = (e) => {
        setSelectedModel(e.target.value);
    };

    const handleSavePrompt = async values => {
        const promptData = { ...values, model: selectedModel };
        if (!values.queueId) {
            toastError(i18n.t("promptModal.setor"));
            return;
        }
        try {
            if (promptId) {
                await api.put(`/prompt/${promptId}`, promptData);
            } else {
                await api.post("/prompt", promptData);
            }
            toast.success(i18n.t("promptModal.success"));
            refreshPrompts(  )
        } catch (err) {
            toastError(err);
        }
        handleClose();
    };

    return (
        <div className={classes.root}>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                scroll="paper"
                fullWidth
            >
                <DialogTitle id="form-dialog-title">
                    {promptId
                        ? `${i18n.t("promptModal.title.edit")}`
                        : `${i18n.t("promptModal.title.add")}`}
                </DialogTitle>
                <Formik
                    initialValues={prompt}
                    enableReinitialize={true}
                    validationSchema={PromptSchema}
                    onSubmit={(values, actions) => {
                        setTimeout(() => {
                            handleSavePrompt(values);
                            actions.setSubmitting(false);
                        }, 400);
                    }}
                >
                    {({ touched, errors, isSubmitting, values, setFieldValue }) => (
                        <Form style={{ width: "100%" }}>
                            <DialogContent dividers>
                                <Box className={classes.section}>
                                    <Typography variant="subtitle1" className={classes.sectionTitle}>
                                        Identidade do agente
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Field
                                                as={TextField}
                                                label={i18n.t("promptModal.form.name")}
                                                name="name"
                                                error={touched.name && Boolean(errors.name)}
                                                helperText={touched.name && errors.name}
                                                variant="outlined"
                                                margin="dense"
                                                fullWidth
                                                placeholder="Assistente de Suporte, Concierge, Vendas B2B..."
                                            />
                                            <Typography variant="caption" className={classes.inlineHelper}>
                                                Dica: use nomes claros que indiquem função e público (ex.: “Suporte Premium B2B”).
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box width="100%">
                                                <QueueSelectSingle touched={touched} errors={errors}/>
                                            </Box>
                                            <Typography variant="caption" className={classes.inlineHelper}>
                                                Selecione o setor/ fila onde o agente atuará.
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <FormControl fullWidth margin="dense" variant="outlined">
                                                <Field
                                                    as={TextField}
                                                    label={i18n.t("promptModal.form.apikey")}
                                                    name="apiKey"
                                                    type={showApiKey ? 'text' : 'password'}
                                                    error={touched.apiKey && Boolean(errors.apiKey)}
                                                    helperText={touched.apiKey && errors.apiKey}
                                                    variant="outlined"
                                                    margin="dense"
                                                    fullWidth
                                                    placeholder="Cole sua API Key segura aqui"
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={handleToggleApiKey}>
                                                                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                </Box>

                                <Box className={classes.section}>
                                    <Typography variant="subtitle1" className={classes.sectionTitle}>
                                        Contexto e prompt
                                    </Typography>
                                    <Typography variant="body2" className={classes.helper}>
                                        Explique a personalidade, limites e objetivos do agente. Inclua regras de segurança, tom de voz e exemplos de respostas.
                                    </Typography>
                                    <Field
                                        as={TextField}
                                        label={i18n.t("promptModal.form.prompt")}
                                        name="prompt"
                                        error={touched.prompt && Boolean(errors.prompt)}
                                        helperText={touched.prompt && errors.prompt}
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                        rows={10}
                                        multiline={true}
                                        placeholder="Ex: Você é um agente de suporte focado em resolver dúvidas de clientes B2B. Responda de forma concisa, em português, com tom profissional e empático..."
                                    />
                                </Box>

                                <Box className={classes.section}>
                                    <Typography variant="subtitle1" className={classes.sectionTitle}>
                                        Configurações do modelo
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={5}>
                                            <FormControl fullWidth margin="dense" variant="outlined">
                                                <InputLabel>{i18n.t("promptModal.form.model")}</InputLabel>
                                                <Select
                                                    id="type-select"
                                                    labelWidth={60}
                                                    name="model"
                                                    value={selectedModel}
                                                    onChange={handleChangeModel}
                                                    multiple={false}
                                                >
                                                    {modelOptions.map(option => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            <Box display="flex" flexDirection="column">
                                                                <Typography variant="body1">{option.label}</Typography>
                                                                <Typography variant="caption" color="textSecondary">{option.helper}</Typography>
                                                            </Box>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={7}>
                                            <Box className={classes.sliderRow}>
                                                <Typography gutterBottom variant="body2">
                                                    {i18n.t("promptModal.form.temperature")} (0 = respostas estáveis, 1 = criativas)
                                                </Typography>
                                                <Slider
                                                    value={Number(values.temperature)}
                                                    step={0.1}
                                                    min={0}
                                                    max={1}
                                                    onChange={(_, value) => setFieldValue("temperature", value)}
                                                    valueLabelDisplay="auto"
                                                    marks={temperatureMarks}
                                                />
                                            </Box>
                                            {touched.temperature && errors.temperature && (
                                                <Typography variant="caption" color="error">
                                                    {errors.temperature}
                                                </Typography>
                                            )}
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Field
                                                as={TextField}
                                                label={i18n.t("promptModal.form.max_tokens")}
                                                name="maxTokens"
                                                error={touched.maxTokens && Boolean(errors.maxTokens)}
                                                helperText={touched.maxTokens && errors.maxTokens}
                                                variant="outlined"
                                                margin="dense"
                                                fullWidth
                                            />
                                            <Typography variant="caption" className={classes.helper}>
                                                Limite de tokens por resposta (controle tamanho/ custo).
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Field
                                                as={TextField}
                                                label={i18n.t("promptModal.form.max_messages")}
                                                name="maxMessages"
                                                error={touched.maxMessages && Boolean(errors.maxMessages)}
                                                helperText={touched.maxMessages && errors.maxMessages}
                                                variant="outlined"
                                                margin="dense"
                                                fullWidth
                                            />
                                            <Typography variant="caption" className={classes.helper}>
                                                Quantidade de mensagens do histórico enviadas para contexto.
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    onClick={handleClose}
                                    color="secondary"
                                    disabled={isSubmitting}
                                    variant="outlined"
                                >
                                    {i18n.t("promptModal.buttons.cancel")}
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    disabled={isSubmitting}
                                    variant="contained"
                                    className={classes.btnWrapper}
                                >
                                    {promptId
                                        ? `${i18n.t("promptModal.buttons.okEdit")}`
                                        : `${i18n.t("promptModal.buttons.okAdd")}`}
                                    {isSubmitting && (
                                        <CircularProgress
                                            size={24}
                                            className={classes.buttonProgress}
                                        />
                                    )}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </Dialog>
        </div>
    );
};

export default PromptModal;
