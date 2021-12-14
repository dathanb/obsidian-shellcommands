import {SC_AbstractFileMenuEvent} from "./SC_AbstractFileMenuEvent";
import {TShellCommand} from "../TShellCommand";
import {ShellCommandVariable} from "../variables/ShellCommandVariable";
import {Variable_EventFileName} from "../variables/event_variables/Variable_EventFileName";
import {Variable_EventFilePath} from "../variables/event_variables/Variable_EventFilePath";

export class SC_Event_FileMenu extends SC_AbstractFileMenuEvent {
    protected readonly event_name = "file-menu";
    protected readonly event_title = "File menu";
    protected file_or_folder: "file" = "file";

    protected declareExtraVariables(t_shell_command: TShellCommand): ShellCommandVariable[] {
        return [
            new Variable_EventFileName(this.plugin, t_shell_command.getShell()).setFile(this.file),
            new Variable_EventFilePath(this.plugin, t_shell_command.getShell()).setFile(this.file),
        ];
    }
}