import * as Constants from '../../../../constants/chat2'
import type * as Types from '../../../../constants/types/chat2'
import * as TeamsConstants from '../../../../constants/teams'
import * as Chat2Gen from '../../../../actions/chat2-gen'
import * as RPCChatTypes from '../../../../constants/types/rpc-chat-gen'
import * as Waiting from '../../../../constants/waiting'
import * as Platform from '../../../../constants/platform'
import {assertionToDisplay} from '../../../../common-adapters/usernames'
import HiddenString from '../../../../util/hidden-string'
import * as Container from '../../../../util/container'
import Input from '.'

type OwnProps = {
  conversationIDKey: Types.ConversationIDKey
  focusInputCounter: number
  jumpToRecent: () => void
  maxInputArea?: number
  onRequestScrollDown: () => void
  onRequestScrollToBottom: () => void
  onRequestScrollUp: () => void
}

// We used to store this in the route state but that's so complicated. We just want a map of id => text if we haven't sent
const unsentText: {[K in Types.ConversationIDKey]: string} = {}

const getUnsentText = (conversationIDKey: Types.ConversationIDKey): string => {
  return unsentText[conversationIDKey] || ''
}

const setUnsentText = (conversationIDKey: Types.ConversationIDKey, text: string) => {
  unsentText[conversationIDKey] = text
}

const getInputHintText = (
  state: Container.TypedState,
  conversationIDKey: Types.ConversationIDKey
): string | undefined => {
  const meta = Constants.getMeta(state, conversationIDKey)
  if (meta.teamType === 'big') {
    return meta.channelname
      ? `Write in ${Platform.isMobile ? '' : `@${meta.teamname}`}#${meta.channelname}`
      : undefined
  }
  if (meta.teamType === 'small') {
    return meta.teamname ? `Write in @${meta.teamname}` : undefined
  }
  if (meta.teamType === 'adhoc') {
    const participantInfo = state.chat2.participantMap.get(conversationIDKey) || Constants.noParticipantInfo
    if (participantInfo.name.length > 2) {
      return 'Message group'
    } else if (participantInfo.name.length === 2) {
      const other = participantInfo.name.find(n => n !== state.config.username)
      if (!other) {
        return undefined
      }
      const otherText = other.includes('@') ? assertionToDisplay(other) : `@${other}`
      return otherText.length < 20 ? `Message ${otherText}` : undefined
    } else if (participantInfo.name.length === 1) {
      return 'Message yourself'
    }
    return undefined
  }
  return undefined
}

export default Container.connect(
  (state, {conversationIDKey}: OwnProps) => {
    const editInfo = Constants.getEditInfo(state, conversationIDKey)
    const quoteInfo = Constants.getQuoteInfo(state, conversationIDKey)
    const meta = Constants.getMeta(state, conversationIDKey)
    const isSearching = Constants.getThreadSearchInfo(state, conversationIDKey).visible
    const inputHintText = getInputHintText(state, conversationIDKey)
    const _you = state.config.username
    const explodingModeSeconds = Constants.getConversationExplodingMode(state, conversationIDKey)
    const isExploding = explodingModeSeconds !== 0
    const unsentText = state.chat2.unsentTextMap.get(conversationIDKey)
    const prependText = state.chat2.prependTextMap.get(conversationIDKey)
    const showCommandMarkdown = (state.chat2.commandMarkdownMap.get(conversationIDKey) || '') !== ''
    const showCommandStatus = !!state.chat2.commandStatusMap.get(conversationIDKey)
    const showGiphySearch = state.chat2.giphyWindowMap.get(conversationIDKey) || false
    const _replyTo = Constants.getReplyToMessageID(state, conversationIDKey)
    const _containsLatestMessage = state.chat2.containsLatestMessageMap.get(conversationIDKey) || false
    const suggestBotCommandsUpdateStatus =
      state.chat2.botCommandsUpdateStatusMap.get(conversationIDKey) ||
      RPCChatTypes.UIBotCommandsUpdateStatusTyp.blank

    return {
      _containsLatestMessage,
      _draft: Constants.getDraft(state, conversationIDKey),
      _editOrdinal: editInfo ? editInfo.ordinal : null,
      _isExplodingModeLocked: Constants.isExplodingModeLocked(state, conversationIDKey),
      _replyTo,
      _you,
      cannotWrite: meta.cannotWrite,
      conversationIDKey,
      editText: editInfo ? editInfo.text : '',
      explodingModeSeconds,
      infoPanelShowing: state.chat2.infoPanelShowing,
      inputHintText,
      isActiveForFocus: state.chat2.focus === null,
      isEditExploded: editInfo ? editInfo.exploded : false,
      isExploding,
      isSearching,
      minWriterRole: meta.minWriterRole,
      prependText,
      quoteCounter: quoteInfo ? quoteInfo.counter : 0,
      quoteText: quoteInfo ? quoteInfo.text : '',
      showCommandMarkdown,
      showCommandStatus,
      showGiphySearch,
      showTypingStatus:
        Constants.getTyping(state, conversationIDKey).size !== 0 && !showGiphySearch && !showCommandMarkdown,
      showWalletsIcon: Constants.shouldShowWalletsIcon(state, conversationIDKey),
      suggestBotCommands: Constants.getBotCommands(state, conversationIDKey),
      suggestBotCommandsUpdateStatus,
      suggestChannelsLoading: Waiting.anyWaiting(
        state,
        TeamsConstants.getChannelsWaitingKey(meta.teamID),
        Constants.waitingKeyMutualTeams(conversationIDKey)
      ),
      suggestCommands: Constants.getCommands(state, conversationIDKey),
      typing: Constants.getTyping(state, conversationIDKey),
      unsentText,
    }
  },
  dispatch => ({
    _clearPrependText: (conversationIDKey: Types.ConversationIDKey) => {
      dispatch(Chat2Gen.createSetPrependText({conversationIDKey, text: null}))
    },
    _clearUnsentText: (conversationIDKey: Types.ConversationIDKey) => {
      dispatch(Chat2Gen.createSetUnsentText({conversationIDKey}))
    },
    _onEditMessage: (conversationIDKey: Types.ConversationIDKey, ordinal: Types.Ordinal, body: string) =>
      dispatch(
        Chat2Gen.createMessageEdit({
          conversationIDKey,
          ordinal,
          text: new HiddenString(body),
        })
      ),
    _onPostMessage: (
      conversationIDKey: Types.ConversationIDKey,
      text: string,
      replyTo: Types.MessageID | null
    ) =>
      dispatch(
        Chat2Gen.createMessageSend({
          conversationIDKey,
          replyTo: replyTo || undefined,
          text: new HiddenString(text),
        })
      ),
    _sendTyping: (conversationIDKey: Types.ConversationIDKey, typing: boolean) =>
      conversationIDKey && dispatch(Chat2Gen.createSendTyping({conversationIDKey, typing})),
    _unsentTextChanged: (conversationIDKey: Types.ConversationIDKey, text: string) =>
      conversationIDKey &&
      dispatch(Chat2Gen.createUnsentTextChanged({conversationIDKey, text: new HiddenString(text)})),
    clearInboxFilter: () => dispatch(Chat2Gen.createToggleInboxSearch({enabled: false})),
    onSetExplodingModeLock: (conversationIDKey: Types.ConversationIDKey, unset: boolean) =>
      dispatch(Chat2Gen.createSetExplodingModeLock({conversationIDKey, unset})),
  }),
  (stateProps, dispatchProps, ownProps: OwnProps) => {
    return {
      cannotWrite: stateProps.cannotWrite,
      clearInboxFilter: dispatchProps.clearInboxFilter,
      conversationIDKey: stateProps.conversationIDKey,
      editText: stateProps.editText,
      explodingModeSeconds: stateProps.explodingModeSeconds,
      focusInputCounter: ownProps.focusInputCounter,
      getUnsentText: () => {
        // if we have unsent text in the store, that wins, otherwise take what we have stored locally
        const unsentText = stateProps.unsentText
          ? stateProps.unsentText.stringValue()
          : getUnsentText(stateProps.conversationIDKey)
        // The store can also have text to prepend, so do that here
        const ret = stateProps.prependText ? stateProps.prependText.stringValue() + unsentText : unsentText
        // If we have nothing still, check to see if the service told us about a draft and fill that in
        if (!ret) {
          const draft = stateProps._draft
          if (draft) {
            return draft
          }
        }
        return ret
      },
      infoPanelShowing: stateProps.infoPanelShowing,
      inputHintText: stateProps.inputHintText,
      isActiveForFocus: stateProps.isActiveForFocus,
      isEditExploded: stateProps.isEditExploded,
      isEditing: !!stateProps._editOrdinal,
      isExploding: stateProps.isExploding,
      isSearching: stateProps.isSearching,
      maxInputArea: ownProps.maxInputArea,
      minWriterRole: stateProps.minWriterRole,
      onRequestScrollDown: ownProps.onRequestScrollDown,
      onRequestScrollUp: ownProps.onRequestScrollUp,
      onSubmit: (text: string) => {
        if (stateProps._editOrdinal) {
          dispatchProps._onEditMessage(stateProps.conversationIDKey, stateProps._editOrdinal, text)
        } else {
          dispatchProps._onPostMessage(stateProps.conversationIDKey, text, stateProps._replyTo || null)
        }
        if (stateProps._containsLatestMessage) {
          ownProps.onRequestScrollToBottom()
        } else {
          ownProps.jumpToRecent()
        }
      },
      prependText: stateProps.prependText ? stateProps.prependText.stringValue() : null,

      quoteCounter: stateProps.quoteCounter,
      quoteText: stateProps.quoteText,

      sendTyping: (typing: boolean) => {
        dispatchProps._sendTyping(stateProps.conversationIDKey, typing)
      },

      setUnsentText: (text: string) => {
        const set = text.length > 0
        if (stateProps._isExplodingModeLocked !== set) {
          // if it's locked and we want to unset, unset it
          // alternatively, if it's not locked and we want to set it, set it
          dispatchProps.onSetExplodingModeLock(stateProps.conversationIDKey, !set)
        }
        // The store text only lasts until we change it, so blow it away now
        if (stateProps.unsentText) {
          dispatchProps._clearUnsentText(stateProps.conversationIDKey)
        }
        if (stateProps.prependText) {
          if (text !== stateProps.prependText.stringValue()) {
            dispatchProps._clearPrependText(stateProps.conversationIDKey)
          } else {
            // don't set the uncontrolled text tracker to the prepend text by itself, since we want to be
            // able to remove it if the person doesn't change it at all.
            return
          }
        }
        setUnsentText(stateProps.conversationIDKey, text)
      },
      showCommandMarkdown: stateProps.showCommandMarkdown,
      showCommandStatus: stateProps.showCommandStatus,
      showGiphySearch: stateProps.showGiphySearch,
      showReplyPreview: !!stateProps._replyTo,
      showTypingStatus: stateProps.showTypingStatus,
      showWalletsIcon: stateProps.showWalletsIcon,
      suggestBotCommands: stateProps.suggestBotCommands,
      suggestBotCommandsUpdateStatus: stateProps.suggestBotCommandsUpdateStatus,
      suggestChannelsLoading: stateProps.suggestChannelsLoading,
      suggestCommands: stateProps.suggestCommands,
      unsentText: stateProps.unsentText ? stateProps.unsentText.stringValue() : null,
      unsentTextChanged: (text: string) => {
        dispatchProps._unsentTextChanged(stateProps.conversationIDKey, text)
      },
    }
  }
)(Input) as any
