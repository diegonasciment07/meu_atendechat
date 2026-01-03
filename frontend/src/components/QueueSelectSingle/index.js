import React, { useEffect, useState } from "react";
import { Field } from "formik";
import { makeStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles(theme => ({
    formControl: {
        marginTop: theme.spacing(1),
    },
}));

const QueueSelectSingle = ({ touched = {}, errors = {} }) => {
    const classes = useStyles();
    const [queues, setQueues] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/queue");
                setQueues(data);
            } catch (err) {
                toastError(`QUEUESELETSINGLE >>> ${err}`);
            }
        })();
    }, []);

    return (
        <FormControl
            variant="outlined"
            className={classes.formControl}
            margin="dense"
            fullWidth
        >
            <InputLabel id="queue-selection-label">
                {i18n.t("queueSelect.inputLabel")}
            </InputLabel>
            <Field
                as={Select}
                labelId="queue-selection-label"
                id="queue-selection"
                name="queueId"
                label={i18n.t("queueSelect.inputLabel")}
                error={touched.queueId && Boolean(errors.queueId)}
                fullWidth
            >
                {queues.map(queue => (
                    <MenuItem key={queue.id} value={queue.id}>
                        {queue.name}
                    </MenuItem>
                ))}
            </Field>
            {touched.queueId && errors.queueId && (
                <Typography variant="caption" color="error">
                    {errors.queueId}
                </Typography>
            )}
        </FormControl>
    );
};

export default QueueSelectSingle;
