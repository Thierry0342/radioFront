import React from 'react'
import { Route, Routes } from 'react-router-dom'
import homePage from '../../pages/home/component/content/components/eleve-content';


export const HomeRoutes = () => {
    return (
        <Routes>
        <Route path='/home' element={<homePage/>}>
         
        </Route>
    </Routes>   
    )
}