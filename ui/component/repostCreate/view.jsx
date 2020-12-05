// @flow

import * as ICONS from 'constants/icons';
import { CHANNEL_NEW, MINIMUM_PUBLISH_BID, INVALID_NAME_ERROR } from 'constants/claim';
import React from 'react';
import { useHistory } from 'react-router';
import Card from 'component/common/card';
import Button from 'component/button';
import SelectChannel from 'component/selectChannel';
import ErrorText from 'component/common/error-text';
import { FormField } from 'component/common/form';
import { parseURI, isNameValid, creditsToString } from 'lbry-redux';
import usePersistedState from 'effects/use-persisted-state';
import I18nMessage from 'component/i18nMessage';
import analytics from 'analytics';
import LbcSymbol from 'component/common/lbc-symbol';
import ClaimPreview from 'component/claimPreview';

type Props = {
  doToast: ({ message: string }) => void,
  doClearRepostError: () => void,
  doRepost: StreamRepostOptions => Promise<*>,
  title: string, //
  claim?: StreamClaim,
  enteredClaim?: StreamClaim,
  balance: number,
  channels: ?Array<ChannelClaim>,
  doCheckPublishNameAvailability: string => Promise<*>,
  error: ?string,
  reposting: boolean,
  // also, from qs
  uri: string,
  name: string,
  repostUri: string,
  setRepostUri: string => void,
  doCheckPendingClaims: () => void,
};

function RepostCreate(props: Props) {
  const {
    doToast,
    doClearRepostError,
    doRepost,
    claim,
    enteredClaim,
    balance,
    channels,
    error,
    reposting,
    doCheckPublishNameAvailability,
    uri,
    name,
    repostUri,
    setRepostUri,
    doCheckPendingClaims,
  } = props;
  const defaultName = name || (claim && claim.name) || '';
  const contentClaimId = claim && claim.claim_id;
  const enteredClaimId = enteredClaim && enteredClaim.claim_id;
  const [repostChannel, setRepostChannel] = usePersistedState('repost-channel', 'anonymous');
  const [repostBid, setRepostBid] = React.useState(0.01);
  const [showAdvanced, setShowAdvanced] = React.useState();
  const [repostName, setRepostName] = React.useState(defaultName);
  const [enteredUri, setEnteredUri] = React.useState();
  const [available, setAvailable] = React.useState(true);
  const { goBack } = useHistory();

  let repostBidError;
  if (repostBid === 0) {
    repostBidError = __('Deposit cannot be 0');
  } else if (balance === repostBid) {
    repostBidError = __('Please decrease your deposit to account for transaction fees');
  } else if (balance < repostBid) {
    repostBidError = __('Deposit cannot be higher than your balance');
  } else if (repostBid < MINIMUM_PUBLISH_BID) {
    repostBidError = __('Your deposit must be higher');
  }

  let repostNameError;
  if (!repostName) {
    repostNameError = __('A name is required');
  } else if (!isNameValid(repostName, false)) {
    repostNameError = INVALID_NAME_ERROR;
  } else if (!available) {
    repostNameError = __('You already have a claim with this name.');
  }

  const repostUrlName = `lbry://${
    !repostChannel || repostChannel === CHANNEL_NEW || repostChannel === 'anonymous' ? '' : `${repostChannel}/`
  }`;

  React.useEffect(() => {
    if ((repostNameError || repostNameError || repostChannel !== 'anonymous') && !showAdvanced) {
      setShowAdvanced(true);
    }
  }, [repostBidError, repostNameError, showAdvanced, setShowAdvanced]);

  const channelStrings = channels && channels.map(channel => channel.permanent_url).join(',');
  React.useEffect(() => {
    if (!repostChannel && channelStrings) {
      const channels = channelStrings.split(',');
      const newChannelUrl = channels[0];
      const { claimName } = parseURI(newChannelUrl);
      setRepostChannel(claimName);
    }
  }, [channelStrings]);

  React.useEffect(() => {
    if (repostName && isNameValid(repostName, false)) {
      doCheckPublishNameAvailability(repostName).then(r => setAvailable(r));
    }
  }, [repostName, doCheckPublishNameAvailability]);

  React.useEffect(() => {
    // if valid
    if (enteredUri) {
      let isValid = false;
      try {
        parseURI(enteredUri);
        isValid = true;
      } catch (e) {
        isValid = false;
      }
      if (isValid) {
        setRepostUri(enteredUri);
      }
    }
  }, [enteredUri, setRepostUri, parseURI]);

  const repostClaimId = contentClaimId || enteredClaimId;

  function handleSubmit() {
    const channelToRepostTo = channels && channels.find(channel => channel.name === repostChannel);
    if (repostName && repostBid && repostClaimId) {
      doRepost({
        name: repostName,
        bid: creditsToString(repostBid),
        channel_id: channelToRepostTo ? channelToRepostTo.claim_id : undefined,
        claim_id: repostClaimId, // or
      }).then((repostClaim: StreamClaim) => {
        doCheckPendingClaims();
        analytics.apiLogPublish(repostClaim);
        doToast({ message: __('Woohoo! Successfully reposted this claim.') });
        goBack();
      });
    }
  }

  function cancelIt() {
    doClearRepostError();
    goBack();
    // navigate back
  }

  return (
    <Card
      subtitle={
        error ? (
          <ErrorText>{__('There was an error reposting this claim. Please try again later.')}</ErrorText>
        ) : (
          <span>{__('Repost your favorite claims to help more people discover them!')}</span>
        )
      }
      actions={
        <div>
          {name && (
            <FormField
              label={'Name or lbry:// URL to repost'}
              type="text"
              name="repost_url"
              value={enteredUri}
              error={false}
              onChange={event => setEnteredUri(event.target.value)}
            />
          )}
          <fieldset-section>
            <label>{__('Content preview')}</label>
            {(uri || repostUri) && (
              <ClaimPreview
                key={uri || repostUri}
                uri={uri || repostUri}
                actions={''}
                type={'large'}
                showNullPlaceholder
              />
            )}
            {!uri && !repostUri && (
              <ClaimPreview actions={''} type={'large'} placeholder={'loading'} showNullPlaceholder />
            )}
          </fieldset-section>
          {!showAdvanced && (
            <fieldset-section>
              <label>{__('Repost url')}</label>
              <div className="button--uri-indicator">{`${repostUrlName}${repostName}`}</div>
            </fieldset-section>
          )}
          {!showAdvanced && (
            <div className="section__actions">
              <Button button="link" label={__('Advanced')} onClick={() => setShowAdvanced(true)} />
            </div>
          )}

          {showAdvanced && (
            <React.Fragment>
              <fieldset-section>
                <fieldset-group class="fieldset-group--smushed fieldset-group--disabled-prefix">
                  <fieldset-section>
                    <label>{__('Repost url')}</label>
                    <div className="form-field__prefix">{repostUrlName}</div>
                  </fieldset-section>
                  <FormField
                    type="text"
                    name="repost_name"
                    value={repostName}
                    error={repostNameError}
                    onChange={event => setRepostName(event.target.value)}
                  />
                </fieldset-group>
              </fieldset-section>
              <div className="form-field__help">
                <I18nMessage
                  tokens={{
                    lbry_naming_link: (
                      <Button button="link" label={__('community name')} href="https://lbry.com/faq/naming" />
                    ),
                  }}
                >
                  Change this to repost to a different %lbry_naming_link%.
                </I18nMessage>
              </div>

              <SelectChannel
                label={__('Channel to repost on')}
                // hideAnon
                hideNew
                channel={repostChannel}
                onChannelChange={newChannel => setRepostChannel(newChannel)}
              />

              <FormField
                type="number"
                name="repost_bid"
                min="0"
                step="any"
                placeholder="0.123"
                className="form-field--price-amount"
                label={<LbcSymbol postfix={__('Deposit')} size={14} />}
                value={repostBid}
                error={repostBidError}
                disabled={!repostName}
                onChange={event => setRepostBid(parseFloat(event.target.value))}
                onWheel={e => e.stopPropagation()}
              />
            </React.Fragment>
          )}

          <div className="section__actions">
            <Button
              icon={ICONS.REPOST}
              disabled={reposting || repostBidError || repostNameError}
              button="primary"
              label={reposting ? __('Reposting') : __('Repost')}
              onClick={handleSubmit}
            />
            <Button button="link" label={__('Cancel')} onClick={cancelIt} />
          </div>
        </div>
      }
    />
  );
}

export default RepostCreate;
