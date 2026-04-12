type CongratsDialogProps = {
	isOpen: boolean;
	onDismiss: () => void;
};

export default function CongratsDialog({
	isOpen,
	onDismiss,
}: CongratsDialogProps) {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="crossword-dialog-backdrop">
			<div className="crossword-dialog">
				<p className="crossword-dialog__eyebrow">Puzzle complete</p>
				<h2>Congrats! Complete.</h2>
				<p>You finished the shared puzzle. The calendar star is now filled.</p>
				<button
					type="button"
					className="crossword-auth-form__submit"
					onClick={onDismiss}
				>
					Close
				</button>
			</div>
		</div>
	);
}
