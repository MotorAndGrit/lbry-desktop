// @flow
import React from 'react';
import Page from 'component/page';
import { useHistory } from 'react-router';
import RepostCreate from 'component/repostCreate';
import YrblWalletEmpty from 'component/yrblWalletEmpty';
import useThrottle from 'effects/use-throttle';

type Props = {
  balance: number,
  resolveUri: string => void,
};
function RepostPage(props: Props) {
  const { balance, resolveUri } = props;

  const RFROM = 'rfrom';
  const RTO = 'rto';
  const {
    location: { search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const repostFrom = urlParams.get(RFROM);
  const repostTo = urlParams.get(RTO);
  const [repostUri, setRepostUri] = React.useState();
  const throttledValue = useThrottle(repostUri, 500);

  React.useEffect(() => {
    if (throttledValue && resolveUri) {
      resolveUri(throttledValue);
    }
  }, [throttledValue, resolveUri]);

  const decodedFrom = repostFrom && decodeURIComponent(repostFrom);
  return (
    <Page
      noFooter
      noSideNavigation
      backout={{
        title: __('Repost'),
        backLabel: __('Back'),
      }}
    >
      {balance === 0 && <YrblWalletEmpty />}
      <RepostCreate uri={decodedFrom} repostUri={repostUri} setRepostUri={setRepostUri} name={repostTo} />
    </Page>
  );
}

export default RepostPage;
