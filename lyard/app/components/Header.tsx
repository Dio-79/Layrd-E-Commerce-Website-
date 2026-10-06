import React from 'react';

const Header = () => {
    return (
        <>
        {/* ///new limited edition  */}
        <div className="bg-black py-2 text-center">
            <p className= "text-yellow-400 text-cs tracking-wide">
                NEW LIMITED EDITION FLAVORS OUT THIS WEEKEND !
            </p>

        </div>
        {/* //Layrd search bar */}
        <div className= "flex flex-row justify-between p-8">
            <div>search</div>
            <div>LAYRD</div>
            <div>settings</div>

        </div>
        </>
    );
};

export default Header;
