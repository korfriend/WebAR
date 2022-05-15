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

    static convert2dictionary = function(pose_landmarks) {
        // this.srcBones
        let name_to_index = {
            'nose' : 0, 'left_eye_inner' : 1, 'left_eye' : 2, 'left_eye_outer' : 3, 
            'right_eye_inner' : 4, 'right_eye' : 5, 'right_eye_outer' : 6, 
            'left_ear' : 7, 'right_ear' : 8, 'mouse_left' : 9, 'mouse_right' : 10,
            'left_shoulder' : 11, 'right_shoulder' : 12, 'left_elbow' : 13, 'right_elbow' : 14,
            'left_wrist' : 15, 'right_wrist' : 16, 'left_pinky' : 17, 'right_pinky' : 18, 
            'left_index' : 19, 'right_index' : 20, 'left_thumb' : 21, 'right_thumb' : 22, 
            'left_hip' : 23, 'right_hip' : 24, 'left_knee' : 25, 'right_knee' : 26,  
            'left_ankle' : 27, 'right_ankle' : 28, 'left_heel' : 29, 'right_heel' : 30, 
            'left_foot_index' : 31, 'right_foot_index' : 32
        }
        const index_to_name = {} 
        for (const [key, value] of Object.entries(name_to_index)) {
            //console.log(key, value);
            index_to_name[value] = key;
        }
        let pose_landmarks_dict = {};
        pose_landmarks.forEach((landmark, i) => {
            //console.log(i, landmark);
            //console.log(index_to_name[i]);
            pose_landmarks_dict[index_to_name[i]] = landmark;
        });
        //console.log(pose_landmarks_dict);
        
        // for key, k_index in keypoints_to_index.items():
        //     kpts_dict[key] = kpts[:,k_index]

        // kpts_dict['joints'] = list(keypoints_to_index.keys())
        return pose_landmarks_dict;
    }
}

export { CalculateJointAngles };