import React, { Component } from 'react';
import Pusher from 'pusher-js';
import Header from './components/header/header';
import Footer from './components/footer/footer';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      client: null,
      potentialClient: null,
      region: {
        name: 'Toro',
        latitude: 'response_latitude',
        longitude: 'response.longitude'
      },
      accuracy: null,
      nearby_alert: false,
      got_client: false,
      has_finished_client_hair: false
    };

    this.available_hairdressers_channel = null;
    this.hairD_channel = null;
    this.pusher = null;
  }
  handleAccept = () => {
    this.hairD_channel = this.pusher.subscribe(
      'private-ride-' + this.state.potentialClient.username
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
                username: this.state.potentialClient.username,
                pickup: this.state.potentialClient.pickup,
                dropoff: this.state.potentialClient.dropoff
              },
              potentialClient: null
            });
            // THIS WILL SEND hairdresser INFO TO CLIENT
            this.hairD_channel.trigger('client-found-hairdresser', {
              hairdresser: {
                name: 'hairdresser Name'
              }
            });
            this.handleUpdate();
          } else {
            alert('Too late bro!', 'Another hairdresser beat you to it.');
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
        console.log(client_data);
        this.setState({ potentialClient: client_data });
      }
    );
  }
  handleUpdate = () => {
    if (!this.state.has_finished_client_hair) {
      this.hairD_channel.trigger('client-hairdresser-message', {
        type: 'NOTIF',
        title: 'Just a heads up',
        msg: 'Your hairdresser is near, let your presence be known!'
      });

      this.setState({
        nearby_alert: true
      });

      // this.setState({
      //   has_finished_client_hair: true
      // });
    }

    var diff_in_meter_dropoff = 15;

    if (diff_in_meter_dropoff <= 20) {
      this.hairD_channel.trigger('client-hairdresser-message', {
        type: 'near_dropoff',
        title: 'Brace yourself',
        msg:
          "You're very close to your destination. Please prepare your payment."
      });

      this.hairD_channel.unbind('client-hairdresser-response');
      this.pusher.unsubscribe('private-ride-' + this.state.client.username);

      this.setState({
        client: null,
        got_client: false,
        has_finished_client_hair: false
      });
    }

    //  END OF HAIRDRESSER TRANSACTION
  };

  render() {
    return window.innerWidth < 500 ? (
      <div className="App">
        <Header />
        {this.state.potentialClient ? (
          <div className="prompt-box">
            <h4>{`You got a client! ${this.state.potentialClient.name}`}</h4>
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
        <Footer />
      </div>
    ) : (
      <h1>Only available on smartfone screen size</h1>
    );
  }
}

export default App;
