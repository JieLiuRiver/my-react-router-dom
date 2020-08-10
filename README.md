-  `react-router-dom`
    - `BrowserRouter`： 
        - 里面组件是`Router`
        - 维护这2个`context`, 一个是`RouterContext`, 一个是`HistoryContext`
        - `RouterContext`: 为`Provider`组件提供的数据，主要有
            -  `history`：`history`是使用`history`库调用`createHistory`生成的； 
            - `location`: 使用`history`监听location发生变化时记录的，维护的一个`state`, 传递到`Provider`, 供`Consumer`拿到
            - `match`: 拿到`location`对象后，根据`pathname`属性，生成一个这样的对象, 这是默认值
            ```
            { path: "/", url: "/", params: {}, isExact: pathname === "/" };
            ```
        - `HistoryContext`： 为`Provider`组件提供的数据，2个
            - `value`: 就是`RouterContext`的`history`
            - `children`: 渲染子节点
            ```jsx
            <BrowserRouter>
                <div>App</div>
            </BrowserRouter>
            ```
    - `Link`：
        - 使用`React.forwardRef`使得ref穿透，能获取到a标签dom
        - 默认是`a`标签
        - 使用`RouterContext.Consumer`获取到上下文
        - 使用`React.createElement(Component, props)`方式创建
        - `Component`可以自定义，默认是`LinkAnchor`组件，里面逻辑包括`a`标签的点击事件等
        - 点击a标签事件做了什么？ `history.push('/about')`
        - 怎么就渲染对应的`About`组件呢？看`Route`组件逻辑
    - `Route`
        ```
        <Route exact path="/about">
            <About />
        </Route>
        ```
        - 匹配到`/`, 显示组件`About`，`exact`代表精准匹配到才行
        - `Route`是怎么判断是否匹配到路由？
            - `path`值是`/about`, 当前路由`location`信息从`Consumer`里获取
            - 有个`matchPath`函数，传入当前`location`的`pathname`、匹配的路由`/about`,即`matchPath(location.pathname, this.props)`
            - `matchPath`函数，借助`path-to-regexp`库来处理url和参数，把要匹配路由`/about`转换为正则匹配规则，通过调用正则的`exec`方法校验一下，当前路由`pathname`值是否符合这个规则。
            - 如果匹配成功，拿到一个`match`对象，里面有描述匹配相关的属性，比如`url`, 如果`url` === `pathname`, 意味着精准匹配，如果需要`exact`精准匹配，这里有逻辑判断。
            - 总之获得新的`match`后，构造新的`Provider`的`value`数据，这里使用一个`RouterContext.Provider`，是专门为当前路由下提供数据服务的
        - 构造新的数据
            ```jsx
            ... Consumer
            
            const match = matchPath(location.pathname, this.props)
            const props = { ...context, location, match };
            return (
                <RouterContext.Provider value={props}>
                    {...}
                </RouterContext.Provider>
            )
            
            ...Consumer
            ```
        - 子组件渲染规则是怎样的？
            - 如果`match`为null，即未匹配成功
                - 如果`children`是`ReactNode`， 不会渲染
                - 如果`children`是`Function`， 会渲染出来
            ```jsx
            // 当前url: /test
            <Route exact path="/about">
                <About /> // 不会渲染
            </Route>
            
            // 当前url: /test
            <Route exact path="/about">
                {
                    (props) => {
                        return <About />  // 会渲染出来
                    }
                }
            </Route>
            ```
            
            - 如果`match`是个对象，匹配成功
                - 检查是不是有`children`， 再看看`children`是不是函数，总之无论是`Func`还是`ReactNode`都会渲染
                - 没有`children`， 检查有没有传`component`
                    - 有： 渲染`React.createElement(component, props)`
                    - 无： 检查有没有传`render`函数，如果有，执行`render`函数
            
            - 所以优先级是： `children` => `component` => `render`
        - 不使用`Switch`， 有些组件会出现，可能并不是我们预期的，譬如
            ```jsx
            // 当前url是： /about
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/:user">:User</Link>
            
            // 结果，About组件会渲染，而且User组件也会渲染，这是因为设计如此灵活
            ```
            `Switch`的加入, 会去寻找匹配的`Route`， 如果找到了，就停止寻找； 如果到最后都找不到，就渲染没指定`path`的`Route`或指定`*`的`Route`，或者匹配`Redirect`的，保证里面匹配渲染一个
            
    - `Switch`
        - `children`中匹配，匹配到第一个符合的，渲染对应的`Route`
        - 使用`React.Children.forEach`遍历`children`
        - 条件： `match == null && React.isValidElement(child)`, 匹配到及不会再继续匹配
        - 使用`React.cloneElement(element, {location, computedMatch: match})`, 克隆匹配到的`Route`，返回元素的 props 是将新的 props 与原始元素的 props 浅层合并后的结果
        - 匹配的方式还是使用`matchPath`函数
        
       
