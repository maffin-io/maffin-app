import React from 'react';
import { BiCloudUpload, BiLoader } from 'react-icons/bi';
import useSWRImmutable from 'swr/immutable';

import { DataSourceContext } from '@/hooks';

export default function SaveButton(): JSX.Element {
  const { data: isSaving } = useSWRImmutable(
    '/state/save',
    () => false,
  );
  const { isLoaded, save } = React.useContext(DataSourceContext);

  if (!isLoaded) {
    return (
      <button
        type="button"
        className="btn btn-primary"
      >
        ...
      </button>
    );
  }

  return (
    <button
      id="save-button"
      type="button"
      className="btn btn-primary"
      disabled={isSaving}
      onClick={async () => {
        await save();
      }}
    >
      {
        (
          isSaving
          && (
          <>
            <BiLoader className="mr-1 animate-spin" />
            <span>Saving...</span>
          </>
          )
        ) || (
          <>
            <BiCloudUpload className="mr-1" />
            <span>Save</span>
          </>
        )
      }
    </button>
  );
}
