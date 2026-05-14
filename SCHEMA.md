/**
 * Integration Waste Management - Database Schema (Mock)
 */

/*
  Users Table
  - id (string, uuid)
  - name (string)
  - phone (string, unique)
  - role (enum: citizen, driver, admin)
  - zoneId (string, fk -> Zones.id, optional)
*/

/*
  Zones Table
  - id (string, uuid)
  - name (string)
  - boundary (json/array of latlng)
*/

/*
  Trucks Table
  - id (string, uuid)
  - numberPlate (string)
  - driverId (string, fk -> Users.id)
  - zoneId (string, fk -> Zones.id)
  - location (json: {lat, lng})
  - status (enum: idle, on-route, full, maintenance)
*/

/*
  Complaints Table (Incidents/Reports)
  - id (string, uuid)
  - citizenId (string, fk -> Users.id)
  - type (string)
  - description (text)
  - status (enum: pending, resolved, rejected)
  - location (json: {lat, lng}, optional)
  - imageUrl (string, optional)
  - createdAt (timestamp)
*/

/*
  Notifications Table
  - id (string, uuid)
  - userId (string, fk -> Users.id)
  - title (string)
  - message (text)
  - read (boolean)
  - createdAt (timestamp)
*/

/*
  Attendance Table
  - id (string, uuid)
  - driverId (string, fk -> Users.id)
  - checkIn (timestamp)
  - checkOut (timestamp, optional)
  - status (enum: present, absent)
*/
