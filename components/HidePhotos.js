import React, { useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import { Multiselect } from 'multiselect-react-dropdown';
import axios from 'axios';


export default function HidePhotos() {
    const [users, setUsers] = useState([]);
    const [options, setOptions] = useState([]);
    useEffect(() => {
        //make api call
        axios.get('/user/list').then((response) => {
            //console.log("axios response works,", response.data);
            var tmpArray = [];
            var tmpOptions = []; // for names that users sees 
            response.data.map(item => {
                var tmpName = item.first_name + " " + item.last_name;
                var tmpId = item._id;
                tmpOptions.push(tmpName);
                tmpArray.push({
                    name: tmpName, id: tmpId
                });
                setUsers(tmpArray);
                setOptions(tmpOptions);
            })
        }).catch((err) => {
            console.log("error: ", err);
        })

    }, [])
    return (
        <div style={{ color: 'black' }}>
            {console.log('options', options)}
            {/* work with tmpOptions */}
            <Typography>Hi</Typography>
            <Multiselect

                options={options}
                displayValue='Person'
                onSelect={(selectedList, selectedItem) => { console.log('selected list ', selectedList) }}
            />


        </div>
    )
}
