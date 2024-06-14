import React from 'react';
import RModal from 'react-modal';

export type ModalProps = {
  className?: string;
  triggerContent: string | JSX.Element;
  triggerClassName?: string;
  showClose?: boolean;
} & React.PropsWithChildren;

export interface ModalRef {
  openModal: () => void;
  closeModal: () => void;
}

function Modal({
  className = 'modal',
  triggerClassName = '',
  triggerContent,
  showClose = false,
  children,
}: ModalProps, ref: React.Ref<ModalRef>): JSX.Element {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  // Expose actions to the parent
  React.useImperativeHandle(ref, () => ({
    openModal: () => setIsOpen(true),
    closeModal: () => setIsOpen(false),
  }));

  return (
    <>
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
        className={triggerClassName}
      >
        {triggerContent}
      </button>
    </>
  );
}

export default React.forwardRef(Modal);
