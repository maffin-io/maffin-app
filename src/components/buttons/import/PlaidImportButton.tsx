import React from 'react';
import Image from 'next/image';
import { usePlaidLink, PlaidLinkOnSuccess } from 'react-plaid-link';

import useSession from '@/hooks/useSession';
import { Tooltip } from '@/components/tooltips';
import { DataSourceContext } from '@/hooks';
import {
  createConfig,
  createAccounts,
} from '@/lib/external/plaid';
import { createLinkToken, createAccessToken, getTransactions } from '@/app/actions';
import plaidLogo from '@/assets/images/plaid_logo.png';
import { MaffinError } from '@/helpers/errors';

export interface ImportButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  onImport?: Function;
}

/**
 * This component manages the full Plaid flow for retrieving an
 * access token from Plaid and retrieve accounts and transactions.
 *
 * The flow is as follows:
 *   - retrieve a link token
 *   - trigger the Link component where the user selects the entity they want
 *     and returns a public token on success
 *   - exchange the public token with an access token
 *   - call plaid API operations with access token
 */
export default function PlaidImportButton({
  className = '',
  onImport,
  ...props
}: Readonly<ImportButtonProps>): React.JSX.Element {
  const { user, roles } = useSession();
  const [linkToken, setLinkToken] = React.useState('');
  const { isLoaded } = React.useContext(DataSourceContext);

  const onSuccess = React.useCallback<PlaidLinkOnSuccess>(
    async (publicToken, metadata) => {
      try {
        const config = await createConfig(metadata.institution?.institution_id as string);
        const accessToken = await createAccessToken(publicToken);
        config.token = accessToken;
        await config.save();

        const data = await getTransactions(accessToken);
        await createAccounts(config, data.accounts);
      } catch (e) {
        (e as MaffinError).show();
      }
      onImport?.();
    },
    [onImport],
  );

  const { open } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  React.useEffect(() => {
    if (linkToken) {
      open();
    }
  }, [open, linkToken]);

  if (!roles.isBeta) {
    return <span />;
  }

  return (
    <button
      id="plaid-import-button"
      type="button"
      disabled={!(isLoaded)}
      onClick={async () => {
        const token = await createLinkToken({ userId: user?.sub as string });
        setLinkToken(token);
      }}
      className={className}
      {...props}
    >
      <div className="card hover:text-cyan-600 dark:hover:text-white hover:shadow-xl">
        <span
          className="float-right badge default -mt-2 -mr-2"
          data-tooltip-id="plaid-import-help"
        >
          ?
        </span>
        <Tooltip
          id="plaid-import-help"
        >
          <p className="mb-2 text-xs">
            Connect your bank and import transactions automatically.
            Only available in some countries.
          </p>
        </Tooltip>
        <div className="flex items-center">
          <Image className="m-0" src={plaidLogo} alt="" height="65" />
          <span className="inline-block align-middle">Bank</span>
        </div>
      </div>
    </button>
  );
}
