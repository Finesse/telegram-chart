import {Component} from 'inferno';
import shallowEqualObjects from 'shallow-equal/objects';

export default class PureComponent extends Component {
  // Memoize the component render result
  shouldComponentUpdate(nextProps, nextState) {
    return !shallowEqualObjects(this.props, nextProps) || !shallowEqualObjects(this.state, nextState);
  }
}
