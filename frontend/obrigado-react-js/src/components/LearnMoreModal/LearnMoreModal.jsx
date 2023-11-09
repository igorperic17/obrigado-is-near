import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import StepOne from '../Steps/StepOne/StepOne';

const LearnMoreModal = (props) => {
    const {open} = props;

    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: '#0d0a11',
        border: 'none',
        borderRadius: 9,
        boxShadow: 24,
        p: 4,
      };
      
    return <Modal
        open={open}
        // onClose={handleClose}
        >
        <Box sx={style}>
        {/* <Typography id="modal-modal-title" variant="h6" component="h2">
            Text in a modal
        </Typography>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
        </Typography> */}
        <StepOne />
        </Box>
    </Modal>
}

export default LearnMoreModal;