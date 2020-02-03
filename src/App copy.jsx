import React, { Component } from 'react';
import Pusher from 'pusher-js';
import './App.css';
import Header from './components/header/header';
import Footer from './components/footer/footer';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      passenger: null,
      pPassanger: null,
      region: {
        name: 'Toro',
        latitude: 'response_latitude',
        longitude: 'response.longitude'
      },
      accuracy: null,
      nearby_alert: false,
      has_passenger: false,
      has_ridden: false
    };

    this.available_drivers_channel = null;
    this.ride_channel = null;
    this.pusher = null;
  }
  handleAccept = () => {
    this.ride_channel = this.pusher.subscribe(
      'private-ride-' + this.state.pPassanger.username
    );
    this.ride_channel.bind('pusher:subscription_succeeded', () => {
      this.ride_channel.trigger('client-driver-response', {
        response: 'yes'
      });

      this.ride_channel.bind('client-driver-response', driver_response => {
        if (driver_response.response === 'yes') {
          this.setState({
            has_passenger: true,
            passenger: {
              username: this.state.pPassanger.username,
              pickup: this.state.pPassanger.pickup,
              dropoff: this.state.pPassanger.dropoff
            },
            pPassanger: null
          });

          this.ride_channel.trigger('client-found-driver', {
            driver: {
              name: 'John Smith'
            },
            location: {
              latitude: this.state.region.latitude,
              longitude: this.state.region.longitude,
              accuracy: this.state.accuracy
            }
          });
        } else {
          alert('Too late bro!', 'Another driver beat you to it.');
        }
      });
    });
  };
  UNSAFE_componentWillMount() {
    this.pusher = new Pusher('bfa794d9a749bee1f67d', {
      authEndpoint: 'http://localhost:5000/pusher/auth',
      cluster: 'eu',
      encrypted: true
    });

    this.available_drivers_channel = this.pusher.subscribe(
      'private-available-drivers'
    );

    this.available_drivers_channel.bind(
      'client-driver-request',
      passenger_data => {
        this.setState({ pPassanger: passenger_data });
        // if (!this.state.has_passenger) {
        //   alert(
        //     'You got a passenger!',
        //     'Pickup: ' +
        //       passenger_data.pickup.name +
        //       '\nDrop off: ' +
        //       passenger_data.dropoff.name,
        //     [
        //       {
        //         text: 'Later bro',
        //         onPress: () => {
        //           console.log('Cancel Pressed');
        //         },
        //         style: 'cancel'
        //       },
        //       {
        //         text: 'Gotcha!',
        //         onPress: () => {
        //           this.ride_channel = this.pusher.subscribe(
        //             'private-ride-' + passenger_data.username
        //           );
        //           this.ride_channel.bind(
        //             'pusher:subscription_succeeded',
        //             () => {
        //               this.ride_channel.trigger('client-driver-response', {
        //                 response: 'yes'
        //               });

        //               this.ride_channel.bind(
        //                 'client-driver-response',
        //                 driver_response => {
        //                   if (driver_response.response === 'yes') {
        //                     this.setState({
        //                       has_passenger: true,
        //                       passenger: {
        //                         username: passenger_data.username,
        //                         pickup: passenger_data.pickup,
        //                         dropoff: passenger_data.dropoff
        //                       }
        //                     });

        //                     this.ride_channel.trigger('client-found-driver', {
        //                       driver: {
        //                         name: 'John Smith'
        //                       },
        //                       location: {
        //                         latitude: this.state.region.latitude,
        //                         longitude: this.state.region.longitude,
        //                         accuracy: this.state.accuracy
        //                       }
        //                     });
        //                   } else {
        //                     alert(
        //                       'Too late bro!',
        //                       'Another driver beat you to it.'
        //                     );
        //                   }
        //                 }
        //               );
        //             }
        //           );
        //         }
        //       }
        //     ],
        //     { cancelable: false }
        //   );
        // }
      }
    );
  }

  componentDidMount() {
    if (this.state.has_passenger && this.state.passenger) {
      var diff_in_meter_pickup = 15;

      if (diff_in_meter_pickup <= 20) {
        if (!this.state.has_ridden) {
          this.ride_channel.trigger('client-driver-message', {
            type: 'near_pickup',
            title: 'Just a heads up',
            msg: 'Your driver is near, let your presence be known!'
          });

          this.setState({
            has_ridden: true
          });
        }
      } else if (diff_in_meter_pickup <= 50) {
        if (!this.state.nearby_alert) {
          this.setState({
            nearby_alert: true
          });

          alert('Slow down', 'Your passenger is just around the corner');
        }
      }

      var diff_in_meter_dropoff = 15;

      if (diff_in_meter_dropoff <= 20) {
        this.ride_channel.trigger('client-driver-message', {
          type: 'near_dropoff',
          title: 'Brace yourself',
          msg:
            "You're very close to your destination. Please prepare your payment."
        });

        this.ride_channel.unbind('client-driver-response');
        this.pusher.unsubscribe(
          'private-ride-' + this.state.passenger.username
        );

        this.setState({
          passenger: null,
          has_passenger: false,
          has_ridden: false
        });
      }

      this.ride_channel.trigger('client-driver-location', {
        latitude: 'position.coords.latitude',
        longitude: 'position.coords.longitude',
        accuracy: 'position.coords.accuracy'
      });
    }
  }

  render() {
    return window.innerWidth < 500 ? (
      <div className="App">
        <Header />
        {this.state.pPassanger ? (
          <div className="prompt-box">
            <h4>{`You got a client! ${this.state.potential_client}`}</h4>
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
