import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import {
  makeSelectClaimForUri,
  makeSelectTitleForUri,
  selectBalance,
  selectMyChannelClaims,
  doRepost,
  selectRepostError,
  selectRepostLoading,
  doClearRepostError,
  selectMyClaimsWithoutChannels,
  doCheckPublishNameAvailability,
  doCheckPendingClaims,
} from 'lbry-redux';
import { doToast } from 'redux/actions/notifications';
import RepostCreate from './view';

const select = (state, props) => ({
  channels: selectMyChannelClaims(state),
  claim: makeSelectClaimForUri(props.uri)(state),
  enteredClaim: makeSelectClaimForUri(props.repostUri)(state),
  title: makeSelectTitleForUri(props.uri)(state),
  balance: selectBalance(state),
  error: selectRepostError(state),
  reposting: selectRepostLoading(state),
  myClaims: selectMyClaimsWithoutChannels(state),
});

export default connect(select, {
  doHideModal,
  doRepost,
  doClearRepostError,
  doToast,
  doCheckPublishNameAvailability,
  doCheckPendingClaims,
})(RepostCreate);
