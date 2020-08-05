import React, { Component } from 'react';
import Project from './Project';
import json from '../assets/projects.json';

export class Projects extends Component {
  componentDidMount() {
    window.scrollTo(0, 0);
  }
  render() {
    return (
      <div className="container">
        <div className="col-12 mx-auto" style={{ marginRight: "10%", marginLeft: "10%" }}>
          { json.map((v, i) =>
              <Project key={i} title={v.title} description={v.description} image={v.image} date={v.date}/>
            )
          }
        </div>
      </div>
    );
  }
}

export default Projects;
