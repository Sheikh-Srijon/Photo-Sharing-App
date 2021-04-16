import React from 'react';
import {
  Typography, Button, Divider, CardMedia, CardContent, Card,
} from '@material-ui/core';
import './userDetail.css';
import axios from 'axios';




/**
 * Define UserDetail, a React componment of CS142 project #5
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = { myUsers: null, recentPhoto: null, mostCommentedPhoto: null, mostComments: null};
  }

  componentDidMount() {
    //make axios call
    var id = this.props.match.params.userId.toString();
    var url = "/user/" + this.props.match.params.userId.toString();
    // testing new url
    var recentUrl = '/recentPhoto/' + id;
    var commentUrl = '/mostComments/' +id;
    console.log('new cmp mount');
    //generating promises 
    var userPromise = axios.get(url);
    var recentPhotoPromise = axios.get(recentUrl);
    var mostCommentPromise = axios.get(commentUrl);

    axios.all([userPromise, recentPhotoPromise, mostCommentPromise]).then(
      axios.spread((...allData) => {
        const user = allData[0];
        const lastPhoto = allData[1];
        const commentsPhoto = allData[2];
        this.setState({ myUsers: user.data, recentPhoto: lastPhoto.data, mostCommentedPhoto: commentsPhoto.data,
        mostComments: commentsPhoto.data.comments.length});
        console.log('this State check ', this.state);
        // this.setState({recentPhoto : lastPhoto.data});
      })).catch(err => { console.log(err) })




  }
  componentDidUpdate(prevProps, prevState) {
    var id = this.props.match.params.userId.toString();

    if (this.props !== prevProps) {
      var url = "/user/" + this.props.match.params.userId.toString();
     

      var recentUrl = '/recentPhoto/' + id;
      var commentUrl = '/mostComments/' +id;

   

      var userPromise = axios.get(url);
      var recentPhotoPromise = axios.get(recentUrl);
      var mostCommentPromise = axios.get(commentUrl);

      axios.all([userPromise, recentPhotoPromise, mostCommentPromise]).then(
        axios.spread((...allData) => {
          const user = allData[0];
          const lastPhoto = allData[1];
          const commentsPhoto = allData[2];
          this.setState({ myUsers: user.data, recentPhoto: lastPhoto.data, mostCommentedPhoto: commentsPhoto.data,
            mostComments: commentsPhoto.data.comments.length});
            console.log('this State check ', this.state);

        })).catch(err => { console.log(err) })


      // //testing new url
      // var recentUrl = '/recentPhoto/' + id;
      // axios.get(recentUrl).then(response => {
      //   // console.log('recent url ', response);
      //   this.setState({ recentPhoto: response.data });
      // }).catch(err => {
      //   console.log('recenturl err ', err);
      // })

    }
  }



  render() {
    if (this.state.myUsers === null) {
      return (<div>Loading....</div>);
    }
    else {
      return (

        <div className="userDetail">

          <Typography variant="h2">

            {this.state.myUsers.first_name + " " + this.state.myUsers.last_name}
            <Divider />
          </Typography>
          <Typography variant="h6">
            {this.state.myUsers.occupation}
          </Typography>
          <Typography variant="h6">
            {this.state.myUsers.location}

          </Typography>
          <Typography variant="subtitle1">

            Current status : &quot{this.state.myUsers.description}&quot
        </Typography>
          {this.state.recentPhoto === null ? console.log('recent photo null') : 
          <Card style={{flex: 1, height: 500, width: 500}}>
            {console.log(this.state.recentPhoto.file_name)}
            <CardMedia
              style={{ flex: 2}}
              component='img'
              height='400'
              
              src={"/images/" + this.state.recentPhoto.file_name}
            />
            <CardContent style={{flex: 1}}>
              <Typography variant='h6'>
                Recent Photo
            </Typography>
              <Typography>
                Uploaded on {this.state.recentPhoto.date_time.substr(0, 10)}
              </Typography>
            </CardContent>
          </Card>}
          {/* most coment */}

          {this.state.mostCommentedPhoto === null? console.log('most comment photo null'):
          <Card
          style={{height: 500, width: 500}}>
          {console.log(this.state.mostCommentedPhoto.file_name)}
          <CardMedia
          
    
            component='img'
            height='400'
            src={"/images/" + this.state.mostCommentedPhoto.file_name}
          />
          <CardContent>
            <Typography variant='h6'>
              Most commented photo
          </Typography>
            <Typography>
              Comments Count: {this.state.mostComments}
            </Typography>
          </CardContent>
        </Card>
          }

          <div>
            <Divider />
            <Button variant="contained" color="primary"
              href={"#photos/" + this.state.myUsers._id}
            >
              Photos
        </Button>
          </div>

        </div>

      );
    }
  }
}

export default UserDetail;
