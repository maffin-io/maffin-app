import React from 'react';
import { BiCloudUpload, BiLoader, BiWifiOff } from 'react-icons/bi';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames';

import { DataSourceContext } from '@/hooks';
import { useOnline } from '@/hooks/state';
import { UpgradeTooltip } from '@/components/tooltips';
import useSession from '@/hooks/useSession';

export default function SaveButton(): React.JSX.Element {
  const { data: isSaving } = useQuery({
    queryKey: ['state', 'isSaving'],
    queryFn: () => false,
    networkMode: 'always',
  });
  const { isLoaded, save } = React.useContext(DataSourceContext);
  const { isOnline } = useOnline();
  const { roles } = useSession();

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
    <>
      <button
        id="save-button"
        type="button"
        className={classNames(
          'btn btn-primary',
          {
            'btn-danger': !isOnline,
          },
        )}
        disabled={isSaving || !roles.isPremium || !isOnline}
        data-tooltip-id="storage-upgrade-tooltip"
        onClick={async () => {
          await save();
        }}
      >
        {
          (
            isSaving
            && isOnline
            && (
            <>
              <BiLoader className="mr-1 animate-spin" />
              <span>Saving...</span>
            </>
            )
          ) || (
            !isOnline
            && (
              <>
                <BiWifiOff className="mr-1" />
                <span>Save</span>
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
      {
        !roles.isPremium
        && (
          <UpgradeTooltip
            id="storage-upgrade-tooltip"
            message="Auto saving to persistent storage only available for premium users."
          />
        )
      }
    </>
  );
}
