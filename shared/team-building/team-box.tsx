import * as React from 'react'
import GoButton from './go-button'
import UserBubble from './user-bubble'
import * as Kb from '../common-adapters'
import * as Styles from '../styles'
import * as Container from '../util/container'
import {SelectedUser, GoButtonLabel} from '../constants/types/team-building'
import {e164ToDisplay} from '../util/phone-numbers'
import {RolePickerProps} from '.'

type Props = {
  allowPhoneEmail: boolean
  onChangeText: (newText: string) => void
  onEnterKeyDown: () => void
  onDownArrowKeyDown: () => void
  onUpArrowKeyDown: () => void
  teamSoFar: Array<SelectedUser>
  onRemove: (userId: string) => void
  onFinishTeamBuilding: () => void
  searchString: string
  rolePickerProps?: RolePickerProps
  goButtonLabel?: GoButtonLabel
  waitingKey: string | null
}

const formatNameForUserBubble = (u: SelectedUser) => {
  let displayName: string
  switch (u.service) {
    case 'keybase':
    case 'email':
      displayName = u.username
      break
    case 'phone':
      // Username is the assertion username here (E164 without '+'), add '+' to
      // obtain a valid number for formatting. Do not append prettyName, because
      // it's likely just the same phone number but not formated.
      displayName = e164ToDisplay('+' + u.username)
      break
    default:
      displayName = `${u.username} on ${u.service}`
      break
  }
  return `${displayName} ${u.prettyName ? `(${u.prettyName})` : ''}`
}

class UserBubbleCollection extends React.PureComponent<{
  teamSoFar: Props['teamSoFar']
  onRemove: Props['onRemove']
}> {
  render() {
    return this.props.teamSoFar.map(u => (
      <UserBubble
        key={u.userId}
        onRemove={() => this.props.onRemove(u.userId)}
        username={u.username}
        service={u.service}
        tooltip={formatNameForUserBubble(u)}
      />
    ))
  }
}

const TeamBox = (props: Props) => {
  // Scroll to the end when a new user is added so they are visible.
  const scrollViewRef = React.useRef<Kb.ScrollView>(null)
  const last = !!props.teamSoFar.length && props.teamSoFar[props.teamSoFar.length - 1].userId
  const prevLast = Container.usePrevious(last)
  React.useEffect(() => {
    if (prevLast !== undefined && prevLast !== last && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({animated: true})
    }
  }, [prevLast, last])

  const addMorePrompt = props.teamSoFar.length === 1 && (
    <Kb.Text type="BodyTiny" style={styles.addMorePrompt}>
      {`Keep adding people, or click ${props.goButtonLabel ?? 'Start'} when done.`}
    </Kb.Text>
  )
  return Styles.isMobile ? (
    <Kb.Box2 direction="horizontal" fullWidth={true} style={styles.container}>
      <Kb.ScrollView
        horizontal={true}
        alwaysBounceHorizontal={false}
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
      >
        <UserBubbleCollection teamSoFar={props.teamSoFar} onRemove={props.onRemove} />
        {addMorePrompt}
      </Kb.ScrollView>
    </Kb.Box2>
  ) : (
    <Kb.Box2 direction="horizontal" style={styles.container} fullWidth={true}>
      <Kb.Box2 direction="horizontal" style={styles.bubbles}>
        <Kb.ScrollView
          horizontal={true}
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Kb.Box2 direction="horizontal" fullHeight={true}>
            <UserBubbleCollection teamSoFar={props.teamSoFar} onRemove={props.onRemove} />
            {addMorePrompt}
          </Kb.Box2>
        </Kb.ScrollView>
      </Kb.Box2>
      <Kb.Box2 direction="horizontal" fullHeight={true} style={{marginLeft: 'auto'}}>
        {!!props.teamSoFar.length && (
          <GoButton
            label={props.goButtonLabel ?? 'Start'}
            onClick={props.onFinishTeamBuilding}
            waitingKey={props.waitingKey}
          />
        )}
      </Kb.Box2>
    </Kb.Box2>
  )
}

const styles = Styles.styleSheetCreate(
  () =>
    ({
      addMorePrompt: {alignSelf: 'center', marginLeft: 28, maxWidth: 145},
      bubbles: Styles.platformStyles({
        isElectron: {
          overflow: 'hidden',
        },
      }),
      container: Styles.platformStyles({
        common: {
          backgroundColor: Styles.globalColors.blueGrey,
        },
        isElectron: {
          paddingLeft: Styles.globalMargins.xtiny,
          paddingRight: Styles.globalMargins.xsmall,
        },
        isMobile: {
          borderBottomColor: Styles.globalColors.black_10,
          borderBottomWidth: 1,
          borderStyle: 'solid',
          minHeight: 90,
        },
      }),
      scrollContent: Styles.platformStyles({
        isElectron: {
          paddingBottom: Styles.globalMargins.xsmall,
          paddingTop: Styles.globalMargins.xsmall,
        },
        isMobile: {
          paddingBottom: Styles.globalMargins.tiny,
          paddingTop: Styles.globalMargins.tiny,
        },
      }),
      search: Styles.platformStyles({
        common: {
          flex: 1,
          flexWrap: 'wrap',
        },
        isElectron: {
          ...Styles.globalStyles.rounded,
          backgroundColor: Styles.globalColors.white,
          borderColor: Styles.globalColors.black_20,
          borderStyle: 'solid',
          borderWidth: 1,
          maxHeight: 170,
          minHeight: 40,
          overflowY: 'scroll',
        },
        isMobile: {
          borderBottomColor: Styles.globalColors.black_10,
          borderBottomWidth: 1,
          borderStyle: 'solid',
          minHeight: 48,
        },
      }),
      searchIcon: {
        alignSelf: 'center',
        marginLeft: 10,
      },
    } as const)
)

export default TeamBox
