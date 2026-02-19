//! Merkle tree implementation for file integrity verification

use crate::hash::blake3::hash;
use crate::mem::constant_time;
use serde::{Deserialize, Serialize};

/// Merkle tree for efficient proof of chunk inclusion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleTree {
    leaves: Vec<[u8; 32]>,
    nodes: Vec<[u8; 32]>,
}

impl MerkleTree {
    /// Build a Merkle tree from leaf hashes
    ///
    /// # Arguments
    ///
    /// * `leaves` - Leaf hashes (e.g., chunk hashes)
    ///
    /// # Returns
    ///
    /// A new Merkle tree
    pub fn build(leaves: Vec<[u8; 32]>) -> Self {
        if leaves.is_empty() {
            return Self {
                leaves: vec![],
                nodes: vec![],
            };
        }

        let mut nodes = Vec::new();
        let mut current_level = leaves.clone();

        // Build tree bottom-up
        while current_level.len() > 1 {
            let mut next_level = Vec::new();

            for chunk in current_level.chunks(2) {
                let combined = if chunk.len() == 2 {
                    // Hash parent = Hash(left || right)
                    let mut data = [0u8; 64];
                    data[..32].copy_from_slice(&chunk[0]);
                    data[32..].copy_from_slice(&chunk[1]);
                    hash(&data)
                } else {
                    // Odd number of nodes, promote the single node
                    chunk[0]
                };
                next_level.push(combined);
                nodes.push(combined);
            }

            current_level = next_level;
        }

        Self { leaves, nodes }
    }

    /// Get the Merkle root
    ///
    /// # Returns
    ///
    /// The root hash, or a zero hash if the tree is empty
    pub fn root(&self) -> [u8; 32] {
        if self.nodes.is_empty() {
            if self.leaves.is_empty() {
                [0u8; 32]
            } else if self.leaves.len() == 1 {
                self.leaves[0]
            } else {
                // Should not happen if tree is built correctly
                [0u8; 32]
            }
        } else {
            // nodes is guaranteed non-empty here, last element is the root
            *self.nodes.last().expect("nodes verified non-empty above")
        }
    }

    /// Generate a proof of inclusion for a leaf
    ///
    /// # Arguments
    ///
    /// * `index` - Index of the leaf to prove
    ///
    /// # Returns
    ///
    /// A Merkle proof, or None if the index is out of bounds
    pub fn prove(&self, index: usize) -> Option<MerkleProof> {
        if index >= self.leaves.len() {
            return None;
        }

        let mut proof_hashes = Vec::new();
        let mut current_index = index;
        let mut current_level = self.leaves.clone();

        while current_level.len() > 1 {
            // Determine sibling index
            let sibling_index = if current_index % 2 == 0 {
                current_index + 1
            } else {
                current_index - 1
            };

            // Add sibling to proof if it exists
            if sibling_index < current_level.len() {
                proof_hashes.push(current_level[sibling_index]);
            }

            // Move up to next level
            let mut next_level = Vec::new();
            for chunk in current_level.chunks(2) {
                let combined = if chunk.len() == 2 {
                    let mut data = [0u8; 64];
                    data[..32].copy_from_slice(&chunk[0]);
                    data[32..].copy_from_slice(&chunk[1]);
                    hash(&data)
                } else {
                    chunk[0]
                };
                next_level.push(combined);
            }

            current_index /= 2;
            current_level = next_level;
        }

        Some(MerkleProof {
            leaf_hash: self.leaves[index],
            proof_hashes,
            leaf_index: index,
        })
    }

    /// Verify a Merkle proof using constant-time comparison
    ///
    /// # Arguments
    ///
    /// * `proof` - The proof to verify
    /// * `root` - Expected root hash
    /// * `leaf` - The leaf hash being proven
    ///
    /// # Returns
    ///
    /// `true` if the proof is valid, `false` otherwise
    pub fn verify(proof: &MerkleProof, root: &[u8; 32], leaf: &[u8; 32]) -> bool {
        if !constant_time::ct_eq(&proof.leaf_hash, leaf) {
            return false;
        }

        let mut current_hash = *leaf;
        let mut current_index = proof.leaf_index;

        for sibling in &proof.proof_hashes {
            let mut data = [0u8; 64];
            if current_index % 2 == 0 {
                // Current is left child
                data[..32].copy_from_slice(&current_hash);
                data[32..].copy_from_slice(sibling);
            } else {
                // Current is right child
                data[..32].copy_from_slice(sibling);
                data[32..].copy_from_slice(&current_hash);
            }
            current_hash = hash(&data);
            current_index /= 2;
        }

        constant_time::ct_eq(&current_hash, root)
    }
}

/// Proof of inclusion for a leaf in a Merkle tree
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleProof {
    /// Hash of the leaf being proven
    pub leaf_hash: [u8; 32],
    /// Hashes along the path from leaf to root
    pub proof_hashes: Vec<[u8; 32]>,
    /// Index of the leaf in the tree
    pub leaf_index: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merkle_tree_single_leaf() {
        let leaves = vec![hash(b"leaf0")];
        let tree = MerkleTree::build(leaves.clone());
        assert_eq!(tree.root(), leaves[0]);
    }

    #[test]
    fn test_merkle_tree_multiple_leaves() {
        let leaves = vec![
            hash(b"leaf0"),
            hash(b"leaf1"),
            hash(b"leaf2"),
            hash(b"leaf3"),
        ];
        let tree = MerkleTree::build(leaves.clone());
        let root = tree.root();

        // Verify each leaf
        for (i, leaf) in leaves.iter().enumerate() {
            let proof = tree.prove(i).unwrap();
            assert!(MerkleTree::verify(&proof, &root, leaf));
        }
    }

    #[test]
    fn test_merkle_proof_invalid_leaf() {
        let leaves = vec![hash(b"leaf0"), hash(b"leaf1")];
        let tree = MerkleTree::build(leaves);
        let root = tree.root();

        let proof = tree.prove(0).unwrap();
        let wrong_leaf = hash(b"wrong");

        assert!(!MerkleTree::verify(&proof, &root, &wrong_leaf));
    }
}
