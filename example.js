/* global $, JitsiMeetJS */
// const local_username = localStorage.getItem("name");
const meetingid = localStorage.getItem("meetingId");
const local_username = localStorage.getItem("username");
const options = {
    serviceUrl: 'https://dockermeet.memoriadev.com/http-bind',
    hosts: {
        domain: 'dockermeet.memoriadev.com',
        muc: 'conference.dockermeet.memoriadev.com'
    },
    resolution: 1080,
    maxFullResolutionParticipants: 2,
    setSenderVideoConstraint: '1080',
    setReceiverVideoConstraint: '180',
    constraints: {
        video: {
            aspectRatio: 16 / 9,
            height: {
                ideal: 1080,
                max: 1080,
                min: 1080
            }
        }
    },
}

const confOptions = {
    openBridgeChannel: true
};

let connection = null;
let isJoined = false;
let room = null;
let localTracks = [];
const remoteTracks = {};
let isScreenShared = false;

const fullScreenView = (elem) => {
    console.log(elem)
    $(`.${elem}`).toggleClass('fullscreen');
}

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks) {
    localTracks = tracks;
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
            audioLevel => console.log(`Audio Level local: ${audioLevel}`));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
            () => console.log('local track muted'));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
            () => console.log('local track stoped'));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
            deviceId =>
                console.log(
                    `track audio output device was changed to ${deviceId}`));
        if (localTracks[i].getType() === 'video') {
            $('.main_meeting_videos').append(`<video autoplay='1' class="local-video" id='localVideo${i}' />`);
            localTracks[i].attach($(`#localVideo${i}`)[0]);
        } else {
            $('body').append(
                `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
            localTracks[i].attach($(`#localAudio${i}`)[0]);
        }
        if (isJoined) {
            room.addTrack(localTracks[i]);
        }
    }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    if (track.isLocal()) {
        return;
    }
    const participant = track.getParticipantId();
    const participantName = room.getParticipantById(participant)._displayName;

    if (!remoteTracks[participant]) {
        remoteTracks[participant] = [];
    }
    const idx = remoteTracks[participant].push(track);

    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log('remote track muted'));
    track.addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('remote track stoped'));
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        deviceId =>
            console.log(
                `track audio output device was changed to ${deviceId}`));
    const id = participant + track.getType() + idx;


    if (track.getType() === 'video') {

        $('.user_box_list').append(`
                    <div class="user_box_inr ${participant}video-wrapper" onclick="$('#${participant}video${idx}').toggleClass('fullscreen');">
                    <img src="images/img.jpg"  class="d-none" id='${participant}img' alt="">                       
                    <video autoplay='1' class='${participant}video' id='${participant}video${idx}'/>                                     
						<div class="user_name">                           
							<span>${participantName}</span>							
						</div>
                    </div>`
        );
    } else {
        $('body').append(
            `<audio autoplay='1' id='${participant}audio${idx}' />`);
    }

    track.attach($(`#${id}`)[0]);
}



/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
    console.log('conference joined!');
    isJoined = true;
    for (let i = 0; i < localTracks.length; i++) {
        room.addTrack(localTracks[i]);
    }
}

/**
 *
 * @param id
 */
function onUserLeft(id) {
    console.log('user left');
    if (!remoteTracks[id]) {
        return;
    }
    const tracks = remoteTracks[id];

    for (let i = 0; i < tracks.length; i++) {
        tracks[i].detach($(`#${id}${tracks[i].getType()}`));
    }
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
    room = connection.initJitsiConference(meetingid, confOptions);
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
        console.log(`track removed!!!${track}`);

        const participant = track.getParticipantId();
        console.log("participant id ", participant)
        $(`.${participant}video`).remove();
        $(`.${participant}video-wrapper`).remove();


    });
    room.on(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
        console.log('user join');
        remoteTracks[id] = [];
    });
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
        console.log(`${track.getType()} - ${track.isMuted()}`);

        if (track.getType() === 'video') {
            const participant = track.getParticipantId();
            // const idx = remoteTracks[participant].push(track);
            const videotagid = participant + track.getType();
            const imgtagid = participant + 'img';
            console.log("videotagid", videotagid)
            console.log("imgtagid", imgtagid)
            if (!track.isMuted()) {
                $(`.${videotagid}`).removeClass('d-none')
                $(`#${imgtagid}`).addClass('d-none')
            } else {
                $(`.${videotagid}`).addClass('d-none')
                $(`#${imgtagid}`).removeClass('d-none')
            }
        }

    });
    room.on(
        JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
        (userID, displayName) => console.log(`${userID} - ${displayName}`));
    room.on(
        JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
        (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
    room.on(
        JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
        () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
    room.join();
    room.setDisplayName(local_username);
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed() {
    console.error('Connection Failed!');
}

/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged(devices) {
    console.info('current devices', devices);
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
    console.log('disconnect!');
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccess);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        onConnectionFailed);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        disconnect);
}

/**
 * This function is called when we left the meeting.
 */
function unload() {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].dispose();
    }
    room.leave();
    connection.disconnect();
    window.location.href = "./User-Meeting-Detail.html";
}

let isVideo = true;

/**
 *This function is called when we share the screen.
 */
function switchVideo() { // eslint-disable-line no-unused-vars
    if(isScreenShared === true){
        $('.share-screen-icon').removeClass('ToggleIconBoxActive');
        return ;
    }
    isVideo = !isVideo;
    if (localTracks[1]) {
        localTracks[1].dispose();
        localTracks.pop();
    }

    if (isVideo) {
        $('.share-screen-wrapper').removeClass('active')
    } else {
        $('.share-screen-wrapper').addClass('active')
        isScreenShared = true;

    }

    JitsiMeetJS.createLocalTracks({
        devices: [isVideo ? 'video' : 'desktop']
    })
        .then(tracks => {
            localTracks.push(tracks[0]);
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log('local track muted'));
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                () => { 
                    console.log('local track stopped')
                    stopSharing()
                });
            localTracks[1].attach($('#localVideo1')[0]);
            room.addTrack(localTracks[1]);

            console.log('tracks: ', tracks)

            if (tracks[0].videoType === 'camera') {
               
                setTimeout(() => {
                    isVideoMuted = false;
                    $('#video-icon').addClass('ToggleIconBoxActive')
                    onVideoMuteStateChanged();
                }, 700)
            }
        })
        .catch(
            error => {
                console.log(error);
				isScreenShared = false;
                switchVideo();
            }

        );
}

const stopSharing = () => {

    if (localTracks[1]) {
        localTracks[1].dispose();
        localTracks.pop();
    }

    $('.share-screen-icon').removeClass('ToggleIconBoxActive');
    $('.share-screen-wrapper').removeClass('active')
    isScreenShared = false;
    switchVideo();
    // $('.share-screen-wrapper').addClass('active')
}

/**
 *
 * @param selected
 */
function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
}

$(window).bind('beforeunload', unload);
$(window).bind('unload', unload);

JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
const initOptions = {
    disableAudioLevels: true
};

JitsiMeetJS.init(initOptions);

connection = new JitsiMeetJS.JitsiConnection(null, null, options);

connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect);

JitsiMeetJS.mediaDevices.addEventListener(
    JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
    onDeviceListChanged);

connection.connect();

JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] })
    .then(onLocalTracks)
    .catch(error => {
        throw error;
    });

if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
    JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
        const audioOutputDevices
            = devices.filter(d => d.kind === 'audiooutput');

        if (audioOutputDevices.length > 1) {
            $('#audioOutputSelect').html(
                audioOutputDevices
                    .map(
                        d =>
                            `<option value="${d.deviceId}">${d.label}</option>`)
                    .join('\n'));

            $('#audioOutputSelectWrapper').show();
        }
    });
}


/**
 * That function is executed when the track is muted
 */
let isAudioMuted = false;
function muteHandler() {

    console.log("localTracks", localTracks);

    for (let i = 0; i < localTracks.length; i++) {

        if (localTracks[i].type === "audio") {


            try {

                if (isAudioMuted === true) {
                    localTracks[i].unmute();
                    console.log("Your Audio is unmuted");
                } else {
                    localTracks[i].mute();
                    console.log("Your Audio is muted");
                }

            } catch (err) {
                console.log(err);
            }

        }
    }
    isAudioMuted = !isAudioMuted;
}

/**
* That function is executed when the video is muted
*/

let isVideoMuted = false;
async function onVideoMuteStateChanged(e) {
    // const participant = track.getParticipantId();

    console.log("onVideoMuteStateChanged")
    for (let i = 0; i < localTracks.length; i++) {

        if (localTracks[i].type === "video") {

            try {

                if (isVideoMuted === true) {
                    localTracks[i].unmute();
                    console.log("Your video is unmuted");
                    $('.local_video_mute_img').addClass('d-none');
                    $('.local-video').removeClass('d-none')
                    $('.video-on').toggleClass('d-none')
                } else {
                    localTracks[i].mute();
                    console.log("Your video is muted");
                    $('.local-video').addClass('d-none')
                    $('.local_video_mute_img').removeClass('d-none')
                    $('.video-on').toggleClass('d-none')
                }
                isVideoMuted = !isVideoMuted;

            } catch (err) {
                console.log(err);
            }

        }
    }
}
