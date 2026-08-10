import React from 'react';
import RModal from 'react-modal';

export type ModalProps = {
  className: string;
  triggerContent: string | React.JSX.Element;
  triggerProps?: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;
  showClose?: boolean;
  children: ReactModal.Props['children'],
};

export interface ModalRef {
  openModal: () => void;
  closeModal: () => void;
}

function Modal({
  className = 'modal',
  triggerContent,
  triggerProps,
  showClose = false,
  children,
}: ModalProps, ref: React.Ref<ModalRef>): React.JSX.Element {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  // Expose actions to the parent
  React.useImperativeHandle(ref, () => ({
    openModal: () => setIsOpen(true),
    closeModal: () => setIsOpen(false),
  }));

  return (
    <>
      {/* @ts-ignore */}
      <RModal
        isOpen={isOpen}
        overlayClassName="overlay"
        className={className}
        onRequestClose={() => setIsOpen(false)}
      >
        {
          showClose
          && (
            <button
              type="button"
              className="float-right"
              onClick={() => setIsOpen(false)}
            >
              X
            </button>
          )
        }
        {children}
      </RModal>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        {...triggerProps}
      >
        {triggerContent}
      </button>
    </>
  );
}

export default React.forwardRef(Modal);
