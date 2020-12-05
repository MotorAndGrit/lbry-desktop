// @flow
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import React from 'react';
import { parseURI } from 'lbry-redux';
import ClaimPreview from 'component/claimPreview';
import Button from 'component/button';
import ClaimEffectiveAmount from 'component/claimEffectiveAmount';
import HelpLink from 'component/common/help-link';
import I18nMessage from 'component/i18nMessage';
import Card from 'component/common/card';
import { useHistory } from 'react-router';

type Props = {
  query: string,
  winningUri: ?Claim,
  doResolveUris: (Array<string>) => void,
  hideLink?: boolean,
  beginPublish: string => void,
  pendingIds: Array<string>,
};

export default function SearchTopClaim(props: Props) {
  const { doResolveUris, query = '', winningUri, hideLink = false, beginPublish, pendingIds } = props;
  // without pulling in pendingIds, it doesn't update the search component...
  const uriFromQuery = `lbry://${query}`;
  const queryName = query[0] === '@' ? query.slice(1) : query;
  console.log('uriFromQuery', uriFromQuery);
  const { push } = useHistory();
  let name;
  let channelUriFromQuery;
  try {
    const { isChannel, streamName, channelName } = parseURI(uriFromQuery);

    if (!isChannel) {
      channelUriFromQuery = `lbry://@${query}`;
      name = streamName;
    } else {
      name = channelName;
    }
  } catch (e) {}

  React.useEffect(() => {
    let urisToResolve = [];
    if (uriFromQuery) {
      urisToResolve.push(uriFromQuery);
    }

    if (channelUriFromQuery) {
      urisToResolve.push(channelUriFromQuery);
    }

    if (urisToResolve.length > 0) {
      doResolveUris(urisToResolve);
    }
  }, [doResolveUris, uriFromQuery, channelUriFromQuery]);

  return (
    <section className="search">
      <header className="search__header">
        <div className="claim-preview__actions--header">
          {winningUri && (
            <span className="media__uri">
              {__('Most supported')}
              <HelpLink href="https://lbry.com/faq/tipping" />
            </span>
          )}
        </div>
        <div className="card">
          {winningUri && (
            <ClaimPreview
              hideRepostLabel
              uri={winningUri}
              type="large"
              placeholder="publish"
              properties={claim => {
                if (
                  claim &&
                  claim.meta &&
                  claim.meta.effective_amount &&
                  typeof claim.meta.effective_amount === 'number'
                ) {
                  return (
                    <span className="claim-preview__custom-properties">
                      <ClaimEffectiveAmount uri={winningUri} />
                    </span>
                  );
                }
                return null;
              }}
            />
          )}
          {!winningUri && uriFromQuery && (
            <Card
              title={__(`Clean Slate`)}
              subtitle={__(`What do you think should be at lbry://%QUERY_URI%?`, {
                QUERY_URI: queryName,
              })}
              actions={
                <>
                  <div className="section__actions">
                    <Button
                      button="primary"
                      label={__('Repost to %uri%', { uri: queryName })}
                      onClick={() => push(`/$/${PAGES.REPOST_NEW}?rto=${name}`)}
                    />
                    {query[0] !== '@' && (
                      <Button
                        onClick={() => beginPublish(name)}
                        button="link"
                        label={__('Publish to %uri%', { uri: uriFromQuery })}
                      />
                    )}
                  </div>
                </>
              }
            />
          )}
        </div>
        {!hideLink && winningUri && (
          <div className="section__actions--between section__actions--no-margin">
            <span />
            <Button
              button="link"
              className="search__top-link"
              label={
                <I18nMessage tokens={{ name: <strong>{query}</strong> }}>View competing uploads for %name%</I18nMessage>
              }
              navigate={`/$/${PAGES.TOP}?name=${query}`}
              iconRight={ICONS.ARROW_RIGHT}
            />
          </div>
        )}
      </header>
    </section>
  );
}
