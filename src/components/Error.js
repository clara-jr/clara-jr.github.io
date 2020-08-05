import React, { Component } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSkull } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
library.add(faSkull)

class Error extends Component {
  componentDidMount() {
    window.scrollTo(0, 0);
  }
  render() {
   return (
    <div style={{ marginRight: "5%", marginLeft: "5%", textAlign: "center" }}>
      {this.props.error} <FontAwesomeIcon icon="skull" style={{ marginLeft:"5px" }} />
    </div>
   );
  }
};

export default Error;
