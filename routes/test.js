const express = require('express');
const router = express.Router();

let post = [
    {id:1,title: 'Annonixli'},
    {id:2,title: 'Yazijay'},
    {id:3,title: 'Yocode'},
];

//get all posts
router.get('/', (req ,res) => {

    const limit = parseInt(req.query.limit);
    
    if (!isNaN(limit) && limit > 0){
        res.status(200).json(post.slice(0,limit));
    }
    else {
        res.status(200).json(post);
    }

});


module.exports = router;