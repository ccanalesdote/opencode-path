/**
 * Shared user-facing strings for opencode-path commands.
 *
 * Centralize wording, spacing, and punctuation so every command uses the
 * same voice and exact phrases for common concepts such as cancellation,
 * no-op states, restart warnings, and usage errors.
 */

export const CANCELLED = "Cancelled.";
export const NO_CHANGES = "No changes needed.";
export const RESTART_WARNING = "⚠️  Restart opencode to apply changes.";
export const APPLY_CHANGES = "Apply these changes?";

export const USAGE_ERROR_PREFIX = "Error: ";
export const USAGE_SCOPE_EXCLUSIVE = "Cannot use both --global and --project.";
export const USAGE_NON_INTERACTIVE_SCOPE =
  "Non-interactive mode requires --global or --project.";

export const PARTIAL_STATE_WARNING =
  "⚠️  Changes may be partially applied. Verify the files above and re-run the command if needed.";

export const CONFLICT_RESOLVE_HINT =
  "These agents have manual files without the managed marker. Resolve manually.";
export const CONFLICT_SHORT_HINT =
  "Manual file without managed marker. Resolve manually or add the marker.";

export const DRY_RUN_LABEL = "(dry-run)";

export const NEXT_STEP_MODELS = "Next step: Configure models with opencode-path models";
