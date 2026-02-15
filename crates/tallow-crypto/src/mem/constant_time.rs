//! Constant-time operations to prevent timing side-channels

use subtle::{Choice, ConditionallySelectable, ConstantTimeEq};

/// Constant-time equality comparison
///
/// Compares two byte slices in constant time to prevent timing attacks.
///
/// # Arguments
///
/// * `a` - First byte slice
/// * `b` - Second byte slice
///
/// # Returns
///
/// `true` if the slices are equal, `false` otherwise.
/// Always returns `false` if the slices have different lengths.
pub fn ct_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }

    a.ct_eq(b).into()
}

/// Constant-time selection
///
/// Selects between two values based on a condition, in constant time.
///
/// # Arguments
///
/// * `condition` - If true, select `a`, otherwise select `b`
/// * `a` - First value
/// * `b` - Second value
///
/// # Returns
///
/// Either `a` or `b` depending on condition, selected in constant time.
pub fn ct_select<T: ConditionallySelectable + Copy>(condition: bool, a: T, b: T) -> T {
    let choice = Choice::from(condition as u8);
    T::conditional_select(&b, &a, choice)
}

/// Constant-time byte selection
///
/// Specialized version for byte slices that copies into a destination buffer.
///
/// # Arguments
///
/// * `condition` - If true, select from `a`, otherwise from `b`
/// * `a` - First byte slice
/// * `b` - Second byte slice
/// * `dest` - Destination buffer
///
/// # Panics
///
/// Panics if `a`, `b`, and `dest` don't all have the same length.
pub fn ct_select_bytes(condition: bool, a: &[u8], b: &[u8], dest: &mut [u8]) {
    assert_eq!(a.len(), b.len());
    assert_eq!(a.len(), dest.len());

    let choice = Choice::from(condition as u8);
    for i in 0..dest.len() {
        dest[i] = u8::conditional_select(&b[i], &a[i], choice);
    }
}

/// Compare two values and return -1, 0, or 1 in constant time
///
/// # Arguments
///
/// * `a` - First value
/// * `b` - Second value
///
/// # Returns
///
/// - `-1` if a < b
/// - `0` if a == b
/// - `1` if a > b
pub fn ct_compare_u64(a: u64, b: u64) -> i8 {
    let gt = ((b.wrapping_sub(a)) >> 63) as i8;
    let lt = ((a.wrapping_sub(b)) >> 63) as i8;
    gt - lt
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ct_eq() {
        assert!(ct_eq(b"hello", b"hello"));
        assert!(!ct_eq(b"hello", b"world"));
        assert!(!ct_eq(b"hello", b"hello!"));
    }

    #[test]
    fn test_ct_select() {
        assert_eq!(ct_select(true, 42u8, 99u8), 42);
        assert_eq!(ct_select(false, 42u8, 99u8), 99);
    }

    #[test]
    fn test_ct_select_bytes() {
        let a = b"hello";
        let b = b"world";
        let mut dest = [0u8; 5];

        ct_select_bytes(true, a, b, &mut dest);
        assert_eq!(&dest, b"hello");

        ct_select_bytes(false, a, b, &mut dest);
        assert_eq!(&dest, b"world");
    }

    #[test]
    fn test_ct_compare_u64() {
        assert_eq!(ct_compare_u64(10, 20), -1);
        assert_eq!(ct_compare_u64(20, 10), 1);
        assert_eq!(ct_compare_u64(15, 15), 0);
    }
}
