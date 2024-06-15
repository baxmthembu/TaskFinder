import React, {useRef, useEffect, useState} from 'react'
import styles from '../Paypal/paypal.module.css'
import { right } from '@popperjs/core'


const PayPal = () => {

    const [checkout, setCheckOut] = useState(false)
    
    const paypalRef = useRef()

    
    useEffect(() => {
         // Function to modify the PayPal button width
        const resizePayPalButton = () => {
            const newWidth = "170px"; // Set the desired width here
            paypalRef.current.style.width = newWidth;
        };

        const buttons = window.paypal.Buttons({
            style: {
                layout: 'horizontal',
                color:  'blue',
                shape:  'rect',
                disableMaxWidth: true,
                tagline: false,
                height: 35,
                marginRight: 5,
                right: 30,
                label:'pay'
              },
            createOrder: (data, actions, err) => {
                return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [
                        {
                            description: "babysitting",
                            amount: {
                                currency_code: "USD",
                                value: 250
                            }
                        }
                    ]
                })
            },
            onApprove: async (data, actions) => {
                const order = await actions.order.capture()
                console.log(order)
            },
            onError: (err) => {
                console.log(err)
            },
        });

        if(checkout) {
            buttons.render(paypalRef.current);
            resizePayPalButton()
        }

    }, [checkout]);

    const handlePayment = () => {
        // Set the checkout state to true when the button is clicked
        setCheckOut(true);
      };    

    return (
        <div>
            {checkout ? (
                <div>
                    {/* Render the PayPal buttons */}
                    <div ref={paypalRef} id="paypal-button-container"></div>
                </div>
            ) : (
                <button className="button" onClick={handlePayment}>
                Pay
                </button>
            )}
        </div>       
    )
}

export default PayPal