// source is from https://github.com/TemugeB/joint_angles_calculate 

import {
	Quaternion,
	Vector2,
	Vector3
} from 'three';

class CalculateJointAngles {
    constructor( mediapipeBones ) {
        this.srcBones = mediapipeBones;

    }

    convert2dictionary = function() {
        // this.srcBones
        keypoints_to_index = {
            'nose' : 0, 'left_eye_inner' : 1, 'left_eye' : 2, 'left_eye_outer' : 3, 
            'right_eye_inner' : 4, 'right_eye' : 5, 'right_eye_outer' : 6, 
            'left_ear' : 7, 'right_ear' : 8, 'mouse_left' : 9, 'mouse_right' : 10,
            'left_shoulder' : 11, 'right_shoulder' : 12, 'left_elbow' : 13, 'right_elbow' : 14,
            'left_wrist' : 15, 'right_wrist' : 16,

            //'lefthip': 6, 'leftknee': 8, 'leftfoot': 10,
            //              'righthip': 7, 'rightknee': 9, 'rightfoot': 11,
            //              'leftshoulder': 0, 'leftelbow': 2, 'leftwrist': 4,
            //              'rightshoulder': 1, 'rightelbow': 3, 'rightwrist': 5
        }

        // kpts_dict = {}
        // for key, k_index in keypoints_to_index.items():
        //     kpts_dict[key] = kpts[:,k_index]

        // kpts_dict['joints'] = list(keypoints_to_index.keys())
    }
}

export { CalculateJointAngles };