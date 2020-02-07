import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { selectCurrentUser } from '../../redux/user/user.selectors';
import Pusher from 'pusher-js';
import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import loader from '../../assets/loader.gif';
import './homepage.scss';

class Homepage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      client: null,
      potentialClient: null,
      is_working: false,
      start: false,
      got_client: false,
      has_finished_client_hair: false,
      review: null
    };

    this.available_hairdressers_channel = null;
    this.hairD_channel = null;
    this.pusher = null;
  }
  handleUnsubscribe = () => {
    this.hairD_channel.unbind('client-hairdresser-response');
    this.pusher.unsubscribe('private-hairD-' + this.state.client.username);

    this.setState({
      client: null,
      potentialClient: null,
      is_working: false,
      start: false,
      got_client: false,
      has_finished_client_hair: false,
      review: null
    });

    //  END OF HAIRDRESSER TRANSACTION
  };
  handleStart = () => {
    if (!this.state.has_finished_client_hair) {
      this.hairD_channel.trigger('client-hairdresser-message', {
        type: 'STARTING',
        title: `It about to go down!`,
        msg: 'Relax, let make you prettier'
      });
      this.setState({
        start: false,
        is_working: true
      });
    }
    this.hairD_channel.bind('client-hairdresser-message', data => {
      this.setState({
        review: data,
        has_finished_client_hair: true,
        is_working: false
      });
    });
  };
  handleAccept = () => {
    this.hairD_channel = this.pusher.subscribe(
      'private-hairD-' + this.state.potentialClient.username
    );
    this.hairD_channel.bind('pusher:subscription_succeeded', () => {
      this.hairD_channel.trigger('client-hairdresser-response', {
        response: 'yes'
      });

      this.hairD_channel.bind(
        'client-hairdresser-response',
        hairdresser_response => {
          if (hairdresser_response.response === 'yes') {
            this.setState({
              got_client: true,
              client: {
                username: this.state.potentialClient.username
              },
              potentialClient: null
            });
            // THIS WILL SEND hairdresser INFO TO CLIENT
            this.hairD_channel.trigger('client-found-hairdresser', {
              hairdresser: {
                name: this.props.currentUser.name
              }
            });
            this.setState({
              start: true
            });
          } else {
            alert('Too late bro!, Another hairdresser beat you to it.');
          }
        }
      );
    });
  };
  UNSAFE_componentWillMount() {
    this.pusher = new Pusher('bfa794d9a749bee1f67d', {
      authEndpoint: 'https://hairdresser-app.herokuapp.com/pusher/auth',
      cluster: 'eu',
      encrypted: true
    });

    this.available_hairdressers_channel = this.pusher.subscribe(
      'private-available-hairdressers'
    );

    this.available_hairdressers_channel.bind(
      'client-hairdresser-request',
      client_data => {
        this.setState({ potentialClient: client_data });
      }
    );
  }

  render() {
    return window.innerWidth < 500 ? (
      <div className="App">
        <Header />
        {this.state.potentialClient ? (
          <div className="prompt-box">
            <h4>{`You got a client! ${this.state.potentialClient.username}`}</h4>
            <div className="promp-box-footer">
              <button className="btn" onClick={this.handleDecline}>
                Later Bro!
              </button>
              <button className="btn" onClick={this.handleAccept}>
                Gotcha!
              </button>
            </div>
          </div>
        ) : null}
        {this.state.start ? (
          <div className="start">
            <button className="btn" onClick={this.handleStart}>
              Start
            </button>
          </div>
        ) : null}

        {this.state.is_working ? (
          <div className="start-container">
            <div className="start">
              <img src={loader} alt="Loader" />
              <h4>Working...</h4>
            </div>
          </div>
        ) : null}
        {this.state.review ? (
          <div className="start-container">
            <div className="start">
              <h3>{this.state.review.title}</h3>
              <h4>Rate: {this.state.review.msg}</h4>
              <button className="btn" onClick={this.handleUnsubscribe}>
                Done
              </button>
            </div>
          </div>
        ) : null}
        <Footer />
      </div>
    ) : (
      <h1>Only available on smartfone screen size</h1>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  currentUser: selectCurrentUser
});

export default connect(mapStateToProps)(Homepage);
