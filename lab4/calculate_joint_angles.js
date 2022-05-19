// source is from https://github.com/TemugeB/joint_angles_calculate 

import {
	Quaternion,
	Vector2,
	Vector3,
    Matrix3,
    Matrix4
} from 'three';

class ThreeMpPose {
    constructor( mediapipeJoints ) {
        this.srcJoints = mediapipeJoints;

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

        this.poseLandmarks = pose_landmarks_dict;
    }

    static computeR = function(A, B) {
        // get unit vectors
        const uA = A.clone().normalize();
        const uB = B.clone().normalize();
        
        // get products
        const idot = uA.dot(uB);
        const cross_AB = new Vector3.crossVectors(uA, uB);
        const cdot = cross_AB.length();

        // get new unit vectors
        const u = uA.clone();
        const v = new Vector3().subVectors(uB, uA.clone().multiplyScalar(idot));
        v.normalize();
        const w = cross_AB.clone();
        w.normalize();

        // get change of basis matrix
        const C = new Matrix4().makeBasis(u, v, w);

        // get rotation matrix in new basis
        const R_uvw = new Matrix4().set(
            idot, -cdot, 0, 0,
            cdot, idot, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
        
        // full rotation matrix
        const R = new Matrix4().multiplyMatrices(new Matrix4().multiplyMatrices(C, R_uvw), C.clone().transpose());
        return R;
    }

    // decomposes given R matrix into rotation along each axis. In this case Rz @ Ry @ Rx
    static decompose_R_ZYX = function(R) {
        const elements = R.elements;
        const thetaZ = Math.atan2(elements[1], elements[0]);
        const thetaY = Math.atan2(-elements[2], new Vector2(elements[6], elements[10]).length());
        const thetaX = Math.atan2(elements[6], elements[10]);
        return Vector3(thetaX, thetaY, thetaZ);
    }
}

export { CalculateJointAngles };