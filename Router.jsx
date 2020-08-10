import React from "react";
import RouterContext from "./RouterContext.js";
import HistoryContext from './HistoryContext'

class Router extends React.Component {
  static computeRootMatch(pathname) {
    return { path: "/", url: "/", params: {}, isExact: pathname === "/" };
  }

  constructor(props) {
    super(props);

    this.state = {
      location: props.history.location
    };
    this._isMounted = false;
    // 组件未加载完毕，但是 location 发生的变化，暂存在 _pendingLocation 字段中
    this._pendingLocation = null;

    if (!props.staticContext) {
      this.unlisten = props.history.listen(location => {
        console.log('history listen====', location)
        if (this._isMounted) {
          this.setState({ location });
        } else {
          this._pendingLocation = location;
        }
      });
    }
  }

  componentDidMount() {
    this._isMounted = true;

    if (this._pendingLocation) {
      this.setState({ location: this._pendingLocation });
    }
  }

  componentWillUnmount() {
    if (this.unlisten) {
      this.unlisten();
      this._isMounted = false;
      this._pendingLocation = null;
    }
  }

  render () {
    return (
      <RouterContext.Provider
        value={{
          // 根据 HashRouter 还是 BrowserRouter，可判断 history 类型
          history: this.props.history,
          // 这个 location 就是监听 history 变化得到的 location
          location: this.state.location,
          // path url params isExact 四个属性
          match: Router.computeRootMatch(this.state.location.pathname),
          // 只有 StaticRouter 会传 staticContext
          // HashRouter 和 BrowserRouter 都是 null
          staticContext: this.props.staticContext
        }}
      >
        <HistoryContext.Provider
          children={this.props.children || null}
          value={this.props.history}
        />
      </RouterContext.Provider>
    )
  }
}

export default Router