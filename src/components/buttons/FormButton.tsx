import React from 'react';

import { DataSourceContext } from '@/hooks';
import Modal, { ModalRef } from '@/components/ui/Modal';

export interface FormButtonProps extends Omit<
React.ButtonHTMLAttributes<HTMLButtonElement>,
'children'
> {
  buttonContent: string | React.ReactElement,
  modalTitle: string,
  children: React.ReactElement,
}

export default function FormButton({
  buttonContent,
  modalTitle,
  children,
  className = 'btn btn-primary',
  ...props
}: FormButtonProps): JSX.Element {
  const { save } = React.useContext(DataSourceContext);
  const modalRef = React.useRef<ModalRef>(null);

  return (
    <Modal
      ref={modalRef}
      className="modal card"
      triggerContent={buttonContent}
      triggerProps={{ ...props, className }}
      showClose
    >
      <span>{modalTitle}</span>
      <div>
        {
          React.cloneElement(
            children,
            {
              onSave: (e: unknown) => {
                children.props.onSave?.(e);
                save();
                modalRef.current?.closeModal();
              },
            },
          )
        }
      </div>
    </Modal>
  );
}
