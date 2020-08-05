import React, { Component } from 'react';
import { HashRouter, BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import NavBar from './components/NavBar';
import Blog from './components/Blog';
import Post from './components/Post';
import Projects from './components/Projects';
import About from './components/About';
import Error from './components/Error';

export class App extends Component {
  render() {
    return (
      <React.Fragment>
        <HashRouter>
    			<div>
    				<NavBar/>
            <br/>
            <br/>
    				<Switch>
              <Route path="/blog/:id" component={Post} />
    					<Route path="/projects" component={Projects} />
    					<Route path="/about" component={About} />
              <Route path={["/blog", "/index", "/", "/:init"]} exact component={(props) => <Blog init={props.match.params.init} />} />
    					<Route component={Error} />
    				</Switch>
    			</div>
    		</HashRouter>
        <BrowserRouter>
    			<div>
    				<Switch>
              <Redirect from='/blog/:id' to='/#/blog/:id' />
              <Redirect from='/blog' to='/#/blog' />
              <Redirect from='/index' to='/#/index' />
              <Redirect from='/projects' to='/#/projects' />
              <Redirect from='/about' to='/#/about' />
              <Redirect from='/:init' to='/#/:init' />
    				</Switch>
    			</div>
    		</BrowserRouter>
      </React.Fragment>
    );
  }
}

export default App;
