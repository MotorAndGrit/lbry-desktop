// @flow
import type { Node } from 'react';
import React from 'react';
import FreezeframeWrapper from './FreezeframeWrapper';
import Placeholder from './placeholder.png';
import classnames from 'classnames';

type Props = {
  uri: string,
  thumbnail: ?string, // externally sourced image
  children?: Node,
  allowGifs: boolean,
  claim: ?StreamClaim,
  doResolveUri: string => void,
  className?: string,
};

function FileThumbnail(props: Props) {
  const { claim, uri, doResolveUri, thumbnail: rawThumbnail, children, allowGifs = false, className } = props;
  const passedThumbnail = rawThumbnail && rawThumbnail.trim().replace(/^http:\/\//i, 'https://');
  const thumbnailFromClaim =
    uri && claim && claim.value && claim.value.thumbnail ? claim.value.thumbnail.url : undefined;
  const thumbnail = passedThumbnail || thumbnailFromClaim;
  const hasResolvedClaim = claim !== undefined;

  React.useEffect(() => {
    if (!hasResolvedClaim) {
      doResolveUri(uri);
    }
  }, [hasResolvedClaim, uri, doResolveUri]);

  if (!allowGifs && thumbnail && thumbnail.endsWith('gif')) {
    return (
      <FreezeframeWrapper src={thumbnail} className={classnames('media__thumb', className)}>
        {children}
      </FreezeframeWrapper>
    );
  }

  const url = thumbnail || (hasResolvedClaim ? Placeholder : '');

  return (
    <div
      style={{ backgroundImage: `url('${url ? url.replace(/'/g, "\\'") : ''}')` }}
      className={classnames('media__thumb', className, {
        'media__thumb--resolving': !hasResolvedClaim,
      })}
    >
      {children}
    </div>
  );
}

export default FileThumbnail;
