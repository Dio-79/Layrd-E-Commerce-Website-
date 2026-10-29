import React from 'react';
 
export default function Page() {
    return (
        <div>
            <h1> Account settings</h1>
            
            {/* options */}
            <div>
                {/* side bar */}
                <div>
                    <ul>
                        <li>Business profile</li>
                        <li>Delivery addresses</li>
                        <li>payment method</li>
                        <li>Security</li>
                    </ul>
                </div>
                {/* buisness profile */}
                <div>
                    
                    {/* buisness profile header */}
                    <div>
                        
                        <div>
                            <h1>Business profile</h1>
                            <p>This info appears and deliveries</p>

                        </div>
                        <p>Save changes </p>

                    </div>
                    
                    {/* register email */}
                    <div> 
                        <div>
                            <p>Buisness Name</p>
                            <p>cafe aroma ltd</p>
                        </div>
                        <div>
                            <p>Contact person</p>
                            <p>Sara al-harbi</p>
                        </div>
                        <div>
                            <p>Buisness e-mail</p>
                            <p>orders@caferoma.ca</p>
                        </div>
                        <div>
                            <p>phone</p>
                            <p>403 555 0192</p>
                        </div>
                    </div>

                    {/* delivery address and notification */}
                    <div>
                        <div>
                            <p>Primary delivery address</p>
                            <p> blah blah address goes here</p>
                        </div>
                        
                        {/* notifications */}
                        <div>
                            <p>Notifications</p>
                            <p>new wholesale pricing and offers</p>
                            <p> delivery reminders</p>
                            
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}