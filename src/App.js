import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import NavBar from './components/NavBar'
import Blog from './components/Blog'
import Post from './components/Post'
import Projects from './components/Projects'
import Talks from './components/Talks'
import About from './components/About'
import Error from './components/Error'

const App = () => {
  return (
    <Router>
      <div>
        <NavBar />
        <br />
        <br />
        <Switch>
          <Route path="/blog/:id" component={Post} />
          <Route path="/projects" component={Projects} />
          <Route path="/talks" component={Talks} />
          <Route path="/about" component={About} />
          <Route path={['/blog', '/index', '/']} exact component={Blog} />
          <Route component={Error} />
        </Switch>
      </div>
    </Router>
  )
}

export default App
