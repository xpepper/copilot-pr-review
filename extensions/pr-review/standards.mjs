// H1: the project's own written rules steer the review. By default the markdown
// files at the checkout root that are the reviewed head's committed text reach
// the one reviewer each mode names as weighing the whole change, and a finding
// that relies on one of those rules must quote it as exact lines of a named file.
//
// The flag turns that off for one run. Like --long-context it is a flag and
// deliberately not a configuration key: nothing saved decides what a reviewer is
// handed, and it grants nothing, opens no gate and selects no mode.
export const noStandardsFlag = "--no-standards";
