import { BoneConnection, JointNode, SkeletonRig } from '../types/canvas';

/**
 * Clean & Direct Custom Bone Rigging System
 * Allows user to place custom bones/joints directly over drawn artwork!
 */

export function createEmptyRig(): SkeletonRig {
  return {
    id: 'rig_custom',
    name: 'কাস্টম হাড়ের রিগ (Custom Rig)',
    visible: true,
    joints: [],
    bones: [],
  };
}

export function addCustomJoint(
  rig: SkeletonRig,
  x: number,
  y: number,
  parentId: string | null = null
): { newRig: SkeletonRig; newJointId: string } {
  const newId = `joint_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
  const jointCount = rig.joints.length + 1;
  const jointName = `হাড় জয়েন্ট ${jointCount}`;

  // Assign distinct colors based on tree depth or sequence
  const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const col = colors[rig.joints.length % colors.length];

  const newJoint: JointNode = {
    id: newId,
    name: jointName,
    x,
    y,
    parentId,
    color: col,
    radius: 9,
  };

  const newBones = [...rig.bones];
  if (parentId) {
    newBones.push({
      id: `bone_${parentId}_${newId}`,
      fromId: parentId,
      toId: newId,
      thickness: 5,
    });
  }

  return {
    newRig: {
      ...rig,
      joints: [...rig.joints, newJoint],
      bones: newBones,
    },
    newJointId: newId,
  };
}

export function deleteJoint(rig: SkeletonRig, jointId: string): SkeletonRig {
  // Remove joint and all its connected bones
  const updatedJoints = rig.joints.filter((j) => j.id !== jointId);
  const updatedBones = rig.bones.filter((b) => b.fromId !== jointId && b.toId !== jointId);

  return {
    ...rig,
    joints: updatedJoints,
    bones: updatedBones,
  };
}

export function moveJointAndDescendants(
  rig: SkeletonRig,
  draggedJointId: string,
  newX: number,
  newY: number,
  moveDescendants = false
): SkeletonRig {
  const target = rig.joints.find((j) => j.id === draggedJointId);
  if (!target) return rig;

  const dx = newX - target.x;
  const dy = newY - target.y;

  if (!moveDescendants) {
    // Single joint move
    return {
      ...rig,
      joints: rig.joints.map((j) => (j.id === draggedJointId ? { ...j, x: newX, y: newY } : j)),
    };
  }

  // Find all child descendants
  const descendants = new Set<string>();
  function findChildren(id: string) {
    descendants.add(id);
    for (const j of rig.joints) {
      if (j.parentId === id && !descendants.has(j.id)) {
        findChildren(j.id);
      }
    }
  }
  findChildren(draggedJointId);

  return {
    ...rig,
    joints: rig.joints.map((j) => {
      if (descendants.has(j.id)) {
        return { ...j, x: j.x + dx, y: j.y + dy };
      }
      return j;
    }),
  };
}

/**
 * Stamp custom skeleton bone lines and joints onto layer
 */
export function bakeCustomRigToLayer(
  ctx: CanvasRenderingContext2D,
  rig: SkeletonRig,
  style: 'mannequin' | 'guide' = 'mannequin'
) {
  if (rig.joints.length === 0) return;
  ctx.save();
  const jointMap = new Map(rig.joints.map((j) => [j.id, j]));

  if (style === 'mannequin') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw bones
    for (const bone of rig.bones) {
      const from = jointMap.get(bone.fromId);
      const to = jointMap.get(bone.toId);
      if (!from || !to) continue;

      ctx.beginPath();
      ctx.lineWidth = (bone.thickness || 5) * 2.5;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    // Draw joints
    for (const joint of rig.joints) {
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, (joint.radius || 8) * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = joint.color || '#06b6d4';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  } else {
    // Sharp blueprint guide lines
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);

    for (const bone of rig.bones) {
      const from = jointMap.get(bone.fromId);
      const to = jointMap.get(bone.toId);
      if (!from || !to) continue;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    for (const joint of rig.joints) {
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, joint.radius || 7, 0, Math.PI * 2);
      ctx.fillStyle = '#0891b2';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  ctx.restore();
}
