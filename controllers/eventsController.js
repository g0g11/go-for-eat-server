'use strict';

const config = require('../config.js');


class EventsController {
  constructor(Events, monk) {
    this.Events = Events;
    this.monk = monk;
  }

  async createEvent (ctx, next) {
    if ('POST' != ctx.method) return await next();
    // console.log(typeof ctx.user._id);
    const newEvent = {
      place_id: ctx.request.body.place_id,
      place_name: ctx.request.body.place_name,
      place_address: ctx.request.body.place_address,
      location: ctx.request.body.location,
      when: ctx.request.body.when,
      creator: ctx.user._id,
      attendees: [ctx.user._id],
    };
    try {
      for (const key in newEvent) {
        // console.log('here', [key])
        if (!newEvent[key]) throw `Empty parameter ${[key]}`;
      }
      const event = await this.Events.insert(newEvent);
      ctx.status = 201;
      ctx.body = JSON.stringify({'event': event});
    } catch (e) { console.log('Event create error: ', e);
      ctx.status = 400;
    }
  }

 async editEvent (ctx, next) {
    if ('PUT' != ctx.method) return await next();
    // console.log(ctx.request.body);
    try {
      for (const key in ctx.request.body) {
        // console.log('here', [key])
        if (!ctx.request.body[key]) throw `Empty parameter ${[key]}`;
      }
      await this.Events.update({ _id: ctx.params.id }, { $set: {
        place_id: ctx.request.body.place_id,
        place_name: ctx.request.body.place_name,
        place_address: ctx.request.body.place_address,
        location: ctx.request.body.location,
        when: ctx.request.body.when,
      }});
      ctx.status = 204;
    } catch (e) { console.log('Modify create error: ', e); 
      ctx.status = 400;
    }
  };

  async deleteEvent (ctx, next)  {
    if ('DELETE' != ctx.method) return await next();
    const event = await this.Events.findOne({ _id: ctx.params.id, creator: ctx.user._id });
    if (event && event.attendees.lenght === 1) {
      try {
        await this.Events.remove({ _id: ctx.params.id});
        ctx.status = 204;
      } catch(e) { console.log('Deleting event error: ', e);}
    }
  };

  async getEvent (ctx, next) {
    if ('GET' != ctx.method) return await next();

    const event = await this.Events.aggregate([
      { $match: { _id: this.monk.id(ctx.params.id) } },
      { $lookup:
        {
          from: "users",
          localField: "attendees",
          foreignField: "_id",
          as: "attendees"
        },
      },
      { $project: {
          "attendees.email": 0,
          "attendees.birthday": 0,
          "attendees.gender": 0,
          "attendees.events": 0,
          "attendees.created_events": 0,
          "attendees.accessToken": 0,
          "attendees.ratings_average": 0,
          "attendees.ratings_number": 0,
          "attendees.profession": 0,
          "attendees.description": 0,
          "attendees.interests": 0
        }
      }
    ]);
    ctx.status = 200;
    ctx.body = event;
  };

  async joinEvent (ctx, next) {
    if ('PUT' != ctx.method) return await next();
    try {
      await this.Events.update({ _id: ctx.params.id, 'attendees.3': { $exists: false } },
        { $addToSet: { attendees: ctx.user._id }}
      );
      ctx.status = 204;
      // console.log( await this.Events.findOne({_id: ctx.params.id}));
    } catch (e) { console.error('Update user error', e); }
  };

  async leaveEvent (ctx, next) {
    if ('DELETE' != ctx.method) return await next();
    let event = await this.Events.findOne({
      _id: ctx.params.id,
      attendees: ctx.user._id,
      'attendees.1': { $exists: true }
    });
    // console.log('event', event);
    if ( JSON.stringify(event.creator) === JSON.stringify(ctx.user._id) ) {
      event.creator = event.attendees[1];
      console.log('event.attendees[1]', event.attendees[1]);
    }
    try {
      let update = await this.Events.update(
        { _id: ctx.params.id },
        {
          $pull:
            { attendees: ctx.user._id },
          $set:
            { 'creator': event.creator }
        }
      );
      event = await this.Events.findOne({ _id: ctx.params.id });
      // console.log('updated event', event);
      ctx.body = JSON.stringify({'event': event});
      ctx.status = 200;
    } catch (e) { console.log('Leave event error: ', e); }
  };

  async getEvents (ctx, next) {
    if ('GET' != ctx.method) return await next();
    let lat = Number(ctx.request.query.lat);
    let lng = Number(ctx.request.query.lng);
    let distance = Number(ctx.request.query.dist) ? Number(ctx.request.query.dist) : 1000;
    let limit = Number(ctx.request.query.limit) ? Number(ctx.request.query.limit) : 100;
    let from = Number(ctx.request.query.from) ? Number(ctx.request.query.from) : Date.now();
    let to = Number(ctx.request.query.to) ? Number(ctx.request.query.to) : Date.now() + 3600*24*7;
    // console.log(ctx.request.query);
    const events = await this.Events.aggregate([
      { $geoNear: {
        near: { type: "Point", coordinates: [ lat, lng ] },
        distanceField: "distance",
        maxDistance: distance,
        query: { when: { $gte: from , $lte: to } },
        limit: limit,
        spherical: true
      }
    },
    { $lookup:
      {
        from: "users",
        localField: "attendees",
        foreignField: "_id",
        as: "attendees"
      },
    },
    { $project: {
        "attendees.email": 0,
        "attendees.birthday": 0,
        "attendees.gender": 0,
        "attendees.events": 0,
        "attendees.created_events": 0,
        "attendees.accessToken": 0,
        "attendees.ratings_average": 0,
        "attendees.ratings_number": 0,
        "attendees.profession": 0,
        "attendees.description": 0,
        "attendees.interests": 0
      }
    }
  ]);
    // console.log('events', events);
    ctx.status = 200;
    ctx.body = JSON.stringify(events);
  };
}

module.exports = EventsController;