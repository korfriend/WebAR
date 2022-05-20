// source is from https://github.com/TemugeB/joint_angles_calculate 

import {
	Quaternion,
	Vector2,
	Vector3,
    Matrix3,
    Matrix4,
    PerspectiveCamera,
    OrthographicCamera,
    Skeleton
} from 'three';

class ThreeMpPose {
    numSrcLandmarks = function() {return Object.keys(this.index_to_name).length;}
    pose3dDict = {}
    newJoints3D = {}
    mpHierarchy = {}

    constructor() {
        this.name_to_index = {
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
        this.index_to_name = {} 
        for (const [key, value] of Object.entries(this.name_to_index)) {
            //console.log(key, value);
            this.index_to_name[value] = key;
        }
    }

    updateMpLandmarks = function( mediapipeJoints ) {
        this.srcJoints = mediapipeJoints;
        let pose_landmarks_dict = {};
        mediapipeJoints.forEach((landmark, i) => {
            //console.log(i, landmark);
            //console.log(index_to_name[i]);
            pose_landmarks_dict[this.index_to_name[i]] = landmark;
        });
        this.poseLandmarks = pose_landmarks_dict;
    }

    add3dJointsForMixamo = function () {
        const center_hips = new Vector3().addVectors(this.pose3dDict["left_hip"], this.pose3dDict["right_hip"]);
        center_hips.multiplyScalar(0.5);

        const center_shoulders = new Vector3().addVectors(this.pose3dDict["left_shoulder"], this.pose3dDict["right_shoulder"]);
        center_shoulders.multiplyScalar(0.5);

        const dir_spine = new Vector3().subVectors(center_shoulders, center_hips);
        const length_spine = dir_spine.length();
        dir_spine.normalize();
        
        this.newJoints3D["hips"] = new Vector3().addVectors(center_hips, dir_spine.clone().multiplyScalar(length_spine / 9.0));
        this.newJoints3D["neck"] = new Vector3().addVectors(center_shoulders, dir_spine.clone().multiplyScalar(length_spine / 9));
        this.newJoints3D["center_shoulder"] = center_shoulders;

        this.pose3dDict["hips"] = this.newJoints3D["hips"];
        this.pose3dDict["neck"] = this.newJoints3D["neck"];
        this.pose3dDict["center_shoulder"] = this.newJoints3D["center_shoulder"];
    }

    transformToWorld = function(camera, dist_from_cam) {
        // if(camera.isPerspectiveCamera)
        // if the camera is orthogonal, set scale to 1
        const ip_lt = new Vector3(-1, 1, -1).unproject(camera);
        const ip_rb = new Vector3(1, -1, -1).unproject(camera);
        const ip_diff = new Vector3().subVectors(ip_rb, ip_lt);
        const x_scale = Math.abs(ip_diff.x);
        
        function ProjScale(p_ms, cam_pos, src_d, dst_d) {
            let vec_cam2p = new Vector3().subVectors(p_ms, cam_pos);
            return new Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d));
        }

        this.pose3dDict = {};
        for (const [key, value] of Object.entries(this.poseLandmarks)) {
            //console.log(key, value);
            let p_3d = new Vector3((value.x - 0.5) * 2.0, -(value.y - 0.5) * 2.0, 0).unproject(camera);
            p_3d.z = -value.z * x_scale;

            p_3d = camera.isPerspectiveCamera ? ProjScale(p_3d, camera.position, camera.near, dist_from_cam) : p_3d.z += dist_from_cam;
            this.pose3dDict[key] = p_3d;
        }
        //let p_ms = new THREE.Vector3((p.x - 0.5) * 2.0, -(p.y - 0.5) * 2.0, 0).unproject(camera_ar);
        //p_ms.z = -p.z * x_scale;
    }

    rigSolverForMixamo = function (skeleton) {
        this.computeR_hips = function(){
            const hip_joint = this.pose3dDict["hips"];
            let u = new Vector3().subVectors(this.pose3dDict["left_hip"], this.pose3dDict["right_hip"]).normalize();
            const v = new Vector3().subVectors(this.pose3dDict["neck"], hip_joint).normalize();
            const w = new Vector3().crossVectors(u, v).normalize();
            u = new Vector3().crossVectors(v, w).normalize();
            const R = new Matrix4().makeBasis(u, v, w); // local!!
            return R;
        }

        const R_hips = this.computeR_hips();
        const hip_root = skeleton.getBoneByName("mixamorigHips");
        const hip_joint = this.pose3dDict["hips"];
        hip_root.position.set(hip_joint.x, hip_joint.y + 100, hip_joint.z);
        hip_root.quaternion.slerp(new Quaternion().setFromRotationMatrix(R_hips), 0.9); 

        this.computeJointParentR = function(nameSkeletonJoint, nameMpJoint, nameMpJointParent, R_chain, skeleton){
            const skeletonJoint = skeleton.getBoneByName(nameSkeletonJoint);
            const j = skeletonJoint.position.clone();
            const v = new Vector3().subVectors(this.pose3dDict[nameMpJoint], this.pose3dDict[nameMpJointParent]).normalize();
            let R = this.computeR(j, v.applyMatrix4(R_chain.clone().transpose()));
            return R;
        }

        // left arms
        {
            let R_chain = new Matrix4();
            const R_arm = this.computeJointParentR("mixamorigLeftForeArm", "left_elbow", "left_shoulder", R_chain, skeleton);
            skeleton.getBoneByName("mixamorigLeftArm").quaternion.slerp(new Quaternion().setFromRotationMatrix(R_arm), 0.9);

            R_chain = R_chain.multiply(R_arm);
            const R_forearm = this.computeJointParentR("mixamorigLeftHand", "left_wrist", "left_elbow", R_chain, skeleton);
            skeleton.getBoneByName("mixamorigLeftForeArm").quaternion.slerp(new Quaternion().setFromRotationMatrix(R_forearm), 0.9);
        }

        // right arms
        {
            let R_chain = new Matrix4();
            const R_arm = this.computeJointParentR("mixamorigRightForeArm", "right_elbow", "right_shoulder", R_chain, skeleton);
            skeleton.getBoneByName("mixamorigRightArm").quaternion.slerp(new Quaternion().setFromRotationMatrix(R_arm), 0.9);

            R_chain = R_chain.multiply(R_arm);
            const R_forearm = this.computeJointParentR("mixamorigRightHand", "right_wrist", "right_elbow", R_chain, skeleton);
            skeleton.getBoneByName("mixamorigRightForeArm").quaternion.slerp(new Quaternion().setFromRotationMatrix(R_forearm), 0.9);
        }

        // left legs
        {
            let R_chain = R_hips.clone();
            const R_upleg = this.computeJointParentR("mixamorigLeftLeg", "left_knee", "left_hip", R_chain, skeleton);
            skeleton.getBoneByName("mixamorigLeftUpLeg").quaternion.slerp(new Quaternion().setFromRotationMatrix(R_upleg), 0.9);

            R_chain = R_chain.multiply(R_upleg);
            const R_leg = this.computeJointParentR("mixamorigLeftFoot", "left_ankle", "left_knee", R_chain, skeleton);
            skeleton.getBoneByName("mixamorigLeftLeg").quaternion.slerp(new Quaternion().setFromRotationMatrix(R_leg), 0.9);
        }

        // right legs
        {
            let R_chain = R_hips.clone();
            const R_upleg = this.computeJointParentR("mixamorigRightLeg", "right_knee", "right_hip", R_chain, skeleton);
            skeleton.getBoneByName("mixamorigRightUpLeg").quaternion.slerp(new Quaternion().setFromRotationMatrix(R_upleg), 0.9);

            R_chain = R_chain.multiply(R_upleg);
            const R_leg = this.computeJointParentR("mixamorigRightFoot", "right_ankle", "right_knee", R_chain, skeleton);
            skeleton.getBoneByName("mixamorigRightLeg").quaternion.slerp(new Quaternion().setFromRotationMatrix(R_leg), 0.9);
        }

    }

    // rotate a to b
    computeR = function(A, B) {
        // get unit vectors
        const uA = A.clone().normalize();
        const uB = B.clone().normalize();
        
        // get products
        const idot = uA.dot(uB);
        const cross_AB = new Vector3().crossVectors(uA, uB);
        const cdot = cross_AB.length();

        // get new unit vectors
        const u = uA.clone();
        const v = new Vector3().subVectors(uB, uA.clone().multiplyScalar(idot)).normalize();
        const w = cross_AB.clone().normalize();

        // get change of basis matrix
        const C = new Matrix4().makeBasis(u, v, w).transpose();

        // get rotation matrix in new basis
        const R_uvw = new Matrix4().set(
            idot, -cdot, 0, 0,
            cdot, idot, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
        
        // full rotation matrix
        //const R = new Matrix4().multiplyMatrices(new Matrix4().multiplyMatrices(C, R_uvw), C.clone().transpose());
        const R = new Matrix4().multiplyMatrices(C.clone().transpose(), new Matrix4().multiplyMatrices(R_uvw, C));
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

export { ThreeMpPose };