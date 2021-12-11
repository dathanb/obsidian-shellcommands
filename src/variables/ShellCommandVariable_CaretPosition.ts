import {getEditor} from "../Common";
import {addShellCommandVariableInstructions} from "./ShellCommandVariableInstructions";
import {IParameters, ShellCommandVariable} from "./ShellCommandVariable";
import {IAutocompleteItem} from "../settings/setting_elements/Autocomplete";

export class ShellCommandVariable_CaretPosition extends ShellCommandVariable {
    static variable_name = "caret_position";
    static help_text = "Gives the line number and column position of the current caret position as 'line:column'. Get only the line number using {{caret_position:line}}, and only the column with {{caret_position:column}}. Line and column numbers are 1-indexed.";

    protected static readonly parameters: IParameters = {
        mode: {
            options: ["line", "column"],
            required: false,
        },
    };

    protected arguments: {
        mode: string;
    }

    generateValue(): string {
        // Check that we are able to get an editor
        const editor = getEditor(this.app);
        if (null === editor) {
            // Nope.
            this.newErrorMessage("Could not get an editor instance! Please raise an issue in GitHub.");
            return null;
        }

        const position = editor.getCursor('to');
        const line = position.line + 1; // editor position is zero-indexed, line numbers are 1-indexed
        const column = position.ch + 1; // editor position is zero-indexed, column positions are 1-indexed
        
        if (Object.keys(this.arguments).length > 0) {
            switch (this.arguments.mode.toLowerCase()) {
                case "line":
                    return `${line}`;
                case "column":
                    return `${column}`;
                default:
                    this.newErrorMessage("Unrecognised argument: "+this.arguments.mode);
                    return null;
            }
        } else {
            // default case when no args provided
            return `${line}:${column}`;
        }
    }

    public static getAutocompleteItems() {
        return [
            // Normal variables
            <IAutocompleteItem>{
                value: "{{" + this.variable_name + "}}",
                help_text: "Gives the line number and column position of the current caret position as 'line:column'.",
                group: "Variables",
                type: "normal-variable"
            },
            <IAutocompleteItem>{
                value: "{{" + this.variable_name + ":line}}",
                help_text: "Gives the line number of the current caret position.",
                group: "Variables",
                type: "normal-variable"
            },
            <IAutocompleteItem>{
                value: "{{" + this.variable_name + ":column}}",
                help_text: "Gives the column number of the current caret position.",
                group: "Variables",
                type: "normal-variable"
            },

            // Unescaped variables
            <IAutocompleteItem>{
                value: "{{!" + this.variable_name + "}}",
                help_text: "Gives the line number and column position of the current caret position as 'line:column'.",
                group: "Variables",
                type: "unescaped-variable",
            },
            <IAutocompleteItem>{
                value: "{{!" + this.variable_name + ":line}}",
                help_text: "Gives the line number of the current caret position.",
                group: "Variables",
                type: "unescaped-variable",
            },
            <IAutocompleteItem>{
                value: "{{!" + this.variable_name + ":column}}",
                help_text: "Gives the column number of the current caret position.",
                group: "Variables",
                type: "unescaped-variable",
            },
        ];
    }
}

addShellCommandVariableInstructions(
    "{{caret_position}}, {{caret_position:line}} or {{caret_position:column}}",
    ShellCommandVariable_CaretPosition.help_text,
);