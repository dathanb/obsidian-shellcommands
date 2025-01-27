import {App} from "obsidian";
import ShellCommandsPlugin from "../main";
import {escapeValue} from "./escapers/EscapeValue";
import {IAutocompleteItem} from "../settings/setting_elements/Autocomplete";

interface IArguments {
    [key: string]: any;
}

/**
 * key = string, parameter name
 * value = boolean, is the parameter mandatory or not?
 */
export interface IParameters {
    [key: string]: {
        /** What data type is allowed. (New types can be added later). Should be omitted, if 'options' is used. */
        type?: "string" | "integer";
        /** This can define static values for this parameter. Should be omitted, if 'type' is used. */
        options?: string[];
        /** Is this parameter mandatory? */
        required: boolean;
    };
}


export abstract class ShellCommandVariable {
    private static readonly parameter_separator = ":";
    readonly plugin: ShellCommandsPlugin;
    readonly app: App;
    private error_messages: string[] = [];
    public static readonly variable_name: string;
    private shell: string;
    public static readonly help_text: string;

    /**
     * A definition for what parameters this variables takes.
     * @protected
     */
    protected static readonly parameters: IParameters = {};

    /**
     * This contains actual values for parameters.
     * @protected
     */
    protected arguments: IArguments = {};

    /**
     *
     * @param plugin
     * @param shell Used to determine what kind of escaping should be used.
     */
    constructor(plugin: ShellCommandsPlugin, shell: string) {
        this.plugin = plugin
        this.app = plugin.app;
        this.shell = shell;
    }

    public getValue(escape: boolean) {
        let raw_value = this.generateValue();
        if (null === raw_value) {
            // Some error(s) has occurred when generating the variable's value.
            // Prevent passing null to escapeValue().
            return null;
        }
        if (escape) {
            // Value should be escaped.
            return escapeValue(this.shell, raw_value);
        } else {
            // A raw, unescaped value is expected.
            return raw_value;
        }
    }

    protected abstract generateValue(): string|null;

    public getVariableName() {
        const child_class = this.constructor as typeof ShellCommandVariable;
        return child_class.variable_name;
    }

    protected getParameters() {
        const child_class = this.constructor as typeof ShellCommandVariable;
        return child_class.parameters;
    }

    private getParameterSeparator() {
        const child_class = this.constructor as typeof ShellCommandVariable;
        return child_class.parameter_separator;
    }

    getPattern() {
        const error_prefix = this.getVariableName() + ".getPattern(): ";
        let pattern = '\{\{\!?' + this.getVariableName();
        for (let parameter_name in this.getParameters()) {
            const parameter = this.getParameters()[parameter_name];
            let parameter_type_pattern: string = this.getParameterSeparator();  // Here this.parameter_separator (= : ) is included in the parameter value just so that it's not needed to do nested parenthesis to accomplish possible optionality: (:())?. parseShellCommandVariables() will remove the leading : .

            // Check should we use parameter.options or parameter.type.
            if (
                undefined === parameter.options &&
                undefined === parameter.type
            ) {
                // Neither is defined :(
                throw Error(error_prefix + "Parameter '" + parameter_name + "' should define either 'type' or 'options', neither is defined!");
            } else if (
                undefined !== parameter.options &&
                undefined !== parameter.type
            ) {
                // Both are defined :(
                throw Error(error_prefix + "Parameter '" + parameter_name + "' should define either 'type' or 'options', not both!");
            } else if (undefined !== parameter.options) {
                // Use parameter.options
                parameter_type_pattern += parameter.options.join("|" + this.getParameterSeparator()); // E.g. "absolute|:relative" for {{file_path:mode}} variable's 'mode' parameter.
            } else {
                // Use parameter.type
                switch (parameter.type) {
                    case "string":
                        parameter_type_pattern += ".*?";
                        break;
                    case "integer":
                        parameter_type_pattern += "\\d+";
                        break;
                    default:
                        throw Error(error_prefix + "Parameter '" + parameter_name + "' has an unrecognised type: " + parameter.type);
                }
            }

            // Add the subpattern to 'pattern'.
            pattern += "(" + parameter_type_pattern + ")";
            if (!parameter.required) {
                // Make the parameter optional.
                pattern += "?";
            }

        }
        pattern += '\}\}';
        return pattern;
    }

    public getParameterNames() {
        return Object.getOwnPropertyNames(this.getParameters());
    }

    /**
     * @param parameter_name
     * @param argument At this point 'argument' is always a string, but this method may convert it to another data type, depending on the parameter's data type.
     */
    public setArgument(parameter_name: string, argument: string) {
        const parameter_type = this.getParameters()[parameter_name].type ?? "string"; // If the variable uses "options" instead of "type", then the type is always "string".
        switch (parameter_type) {
            case "string":
                this.arguments[parameter_name] = argument;
                break;
            case "integer":
                this.arguments[parameter_name] = parseInt(argument);
                break;
        }
    }

    /**
     * Note that error messages can only exist after getValue() is called!
     */
    getErrorMessages() {
        return this.error_messages;
    }

    protected newErrorMessage(message: string) {
        let prefix = "{{" + this.getVariableName() + "}}: ";
        this.error_messages.push(prefix + message);
    }

    public static getAutocompleteItems(): IAutocompleteItem[] {
        let parameters = ""
        let parameter_indicator = "";
        const parameter_names = Object.getOwnPropertyNames(this.parameters);
        if (parameter_names.length > 0) {
            parameters = this.parameter_separator + parameter_names.join(this.parameter_separator);
            parameter_indicator = this.parameter_separator; // When the variable name ends with a parameter separator character, it indicates to a user that an argument should be supplied.
        }

        return [
            // Normal variable
            <IAutocompleteItem>{
                value: "{{" + this.variable_name + parameter_indicator + "}}",
                help_text: this.help_text,
                group: "Variables",
                type: "normal-variable",
            },

            // Unescaped version of the variable
            <IAutocompleteItem>{
                value: "{{!" + this.variable_name + parameter_indicator + "}}",
                help_text: this.help_text,
                group: "Variables",
                type: "unescaped-variable",
            },
        ];
    }
}
