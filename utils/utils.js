const returnVestingSchedule = vestingInfo => {
    let obj = {
      startTimeInSec: vestingInfo[0].toString(),
      cliffTimeInSec: vestingInfo[1].toString(),
      endTimeInSec: vestingInfo[2].toString(),
	  totalAmount: vestingInfo[3].toString(),
	  totalAmountWithdrawn: vestingInfo[4].toString(),
	  depositor: vestingInfo[5],
      isConfirmed: vestingInfo[6]
    };
    return (obj);
  };

  module.exports = {
	returnVestingSchedule,
  };
  