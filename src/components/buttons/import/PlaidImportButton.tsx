import React from 'react';
import Image from 'next/image';
import { useAuth0 } from '@auth0/auth0-react';
import { usePlaidLink, PlaidLinkOnSuccess } from 'react-plaid-link';

import { Tooltip } from '@/components/tooltips';
import { DataSourceContext } from '@/hooks';
import { createEntitiesFromData } from '@/lib/external/plaid';
import { createLinkToken, createAccessToken, getTransactions } from '@/app/actions/plaid';
import plaidLogo from '@/assets/images/plaid_logo.png';

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
}: Readonly<ImportButtonProps>): JSX.Element {
  const { user } = useAuth0();
  const [linkToken, setLinkToken] = React.useState('');
  const { isLoaded } = React.useContext(DataSourceContext);

  const onSuccess = React.useCallback<PlaidLinkOnSuccess>(async (publicToken) => {
    const accessToken = await createAccessToken(publicToken);
    const data = await getTransactions(accessToken);
    await createEntitiesFromData(data);
    onImport?.();
  }, [onImport]);

  const { open } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  React.useEffect(() => {
    if (linkToken) {
      open();
    }
  }, [open, linkToken]);

  return (
    <button
      id="plaid-import-button"
      type="button"
      disabled={!(isLoaded)}
      onClick={async () => {
        const token = await createLinkToken(user?.sub as string);
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
