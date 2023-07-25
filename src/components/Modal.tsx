import React from 'react';

export type ModalProps = {
  open: boolean;
  setOpen: Function;
  title?: string;
  children: React.ReactNode;
};

export default function Modal({
  open, setOpen, title, children,
}: ModalProps): JSX.Element {
  if (!open) {
    return <span />;
  }

  return (
    <div
      className="fixed inset-0 bg-white bg-opacity-30 overflow-y-auto h-full w-full z-50"
      id="my-modal"
    >
      <div
        className="relative top-20 mx-auto p-5 w-1/3 shadow-lg rounded-md bg-gunmetal-700"
      >
        <button
          type="button"
          className="float-right"
          onClick={() => setOpen(false)}
        >
          X
        </button>
        {
          title
          && (
            <div className="w-full pb-4 border-b border-gunmetal-600">
              <span className="text-lg">
                {title}
              </span>
            </div>
          )
        }
        {children}
      </div>
    </div>
  );
}
